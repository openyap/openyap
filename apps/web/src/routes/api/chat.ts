import {
  createServerFileRoute,
  getWebRequest,
} from "@tanstack/react-start/server";
import { streamText } from "ai";
import type { Id } from "convex/_generated/dataModel";
import type {
  AttachmentId,
  MessageId,
  MessageReasoning,
  MessageUsage,
} from "~/components/chat/types";
import { splitReasoningSteps } from "~/lib/ai/reasoning";
import { webSearch } from "~/lib/ai/webSearch";
import { auth } from "~/lib/auth/server";
import { api, convexServer } from "~/lib/db/server";
import { logger } from "~/lib/logger";
import { getDefaultModel, getModelById, getSystemPrompt } from "~/lib/models";
import { openrouter } from "~/lib/openrouter";

// TODO: update messages with as much fields as possible

const createAiMessage = async ({
  chatId,
  sessionToken,
  provider,
  model,
}: {
  chatId: Id<"chat">;
  sessionToken: string;
  provider: string;
  model: string;
}) => {
  return await convexServer.mutation(api.functions.message.createAiMessage, {
    chatId,
    provider,
    model,
    sessionToken,
  });
};

const updateAiMessage = async ({
  messageId,
  content,
  reasoning,
  status,
  model,
  provider,
  usage,
  historyEntry,
  sessionToken,
}: {
  messageId: MessageId;
  content: string;
  reasoning?: MessageReasoning;
  status: string;
  sessionToken: string;
  model?: string;
  provider?: string;
  usage?: MessageUsage;
  historyEntry?: {
    version: number;
    content: string;
    status: string;
    reasoning?: MessageReasoning;
    provider: string;
    model: string;
    usage?: MessageUsage;
  };
}) => {
  await convexServer.mutation(api.functions.message.updateAiMessage, {
    messageId,
    content,
    reasoning,
    status,
    model,
    provider,
    usage,
    sessionToken,
    historyEntry,
  });
};

const getMessageStatus = async ({
  messageId,
  sessionToken,
}: {
  messageId: MessageId;
  sessionToken: string;
}) => {
  return await convexServer.query(api.functions.message.getMessageStatus, {
    messageId,
    sessionToken,
  });
};

export const ServerRoute = createServerFileRoute("/api/chat").methods({
  GET: ({ request: _ }) => {
    return new Response("What do you think chat?");
  },
  POST: async ({ request }) => {
    const session = await auth.api.getSession({
      headers: getWebRequest()?.headers ?? new Headers(),
    });

    if (!session) {
      return new Response("Unauthorized", { status: 401 });
    }

    const sessionToken = session.session.token;
    const {
      messages,
      chatId,
      modelId: requestedModelId,
      search = false,
      reasoningEffort,
      attachments = [],
    } = await request.json();

    const lastMessage = messages[messages.length - 1];
    let userMessageId: MessageId | null = null;
    let transformedMessages = messages;

    if (lastMessage.role === "user") {
      userMessageId = await convexServer.mutation(
        api.functions.message.createUserMessage,
        {
          chatId,
          content: lastMessage.content,
          sessionToken,
        },
      );

      // Transform messages with attachment content for AI model
      if (attachments.length > 0) {
        // Check if attachments are already uploaded (have IDs) or new base64 data
        const existingAttachmentIds = attachments.filter(
          (att: string | object) =>
            typeof att === "string" && att.startsWith("k"),
        ) as string[];
        const newAttachments = attachments.filter(
          (att: string | object) => typeof att === "object" && "data" in att,
        ) as { name: string; size: number; type: string; data: string }[];

        // Fetch existing attachments data if any
        const existingAttachmentsData = await Promise.all(
          existingAttachmentIds.map(async (attachmentId) => {
            try {
              return await convexServer.query(
                api.functions.attachment.getAttachment,
                {
                  attachmentId: attachmentId as AttachmentId,
                  sessionToken,
                },
              );
            } catch (error) {
              logger.error(
                `Failed to fetch attachment ${attachmentId} from database: ${error}`,
              );
              return null;
            }
          }),
        );

        // Combine all attachments for message transformation
        const allAttachmentsForAI = [
          ...existingAttachmentsData.filter((att) => att !== null),
          ...newAttachments.map((att) => ({
            type: att.type.startsWith("image/") ? "image" : "document",
            name: att.name,
            mimeType: att.type,
            url: `data:${att.type};base64,${att.data}`,
            extractedText: undefined,
          })),
        ];

        // Transform last message to include attachments for AI
        if (allAttachmentsForAI.length > 0) {
          const messageContent: Array<{
            type: string;
            text?: string;
            image?: string;
          }> = [];

          // Add text content if it exists
          if (lastMessage.content.trim()) {
            messageContent.push({ type: "text", text: lastMessage.content });
          }

          for (const attachment of allAttachmentsForAI) {
            if (attachment && attachment.type === "image") {
              messageContent.push({
                type: "image",
                image: attachment.url,
              });
            } else if (
              attachment &&
              (attachment.type === "pdf" || attachment.type === "document")
            ) {
              // For text-based documents, include as text reference
              messageContent.push({
                type: "text",
                text: `[File: ${attachment.name} (${attachment.mimeType})]${attachment.extractedText ? `\n\nContent:\n${attachment.extractedText}` : ""}`,
              });
            }
          }

          // Update transformedMessages with multimodal content
          transformedMessages = [
            ...messages.slice(0, -1),
            {
              ...lastMessage,
              content: messageContent,
            },
          ];
        }

        // Process attachments in background (fire-and-forget) - only for new attachments
        if (newAttachments.length > 0 && userMessageId) {
          (async () => {
            try {
              const uploadPromises = newAttachments.map(
                async (attachment: {
                  name: string;
                  size: number;
                  type: string;
                  data: string;
                }) => {
                  try {
                    // Generate upload URL
                    const uploadUrl = await convexServer.mutation(
                      api.functions.attachment.generateUploadUrl,
                      {
                        sessionToken,
                      },
                    );

                    // Convert base64 to blob
                    const binary = atob(attachment.data);
                    const bytes = new Uint8Array(binary.length);
                    for (let i = 0; i < binary.length; i++) {
                      bytes[i] = binary.charCodeAt(i);
                    }
                    const blob = new Blob([bytes], { type: attachment.type });

                    // Upload to Convex storage
                    const uploadResult = await fetch(uploadUrl, {
                      method: "POST",
                      headers: { "Content-Type": attachment.type },
                      body: blob,
                    });

                    if (!uploadResult.ok) {
                      throw new Error("Upload failed");
                    }

                    const { storageId } = await uploadResult.json();

                    // Create attachment record
                    const attachmentId = await convexServer.mutation(
                      api.functions.attachment.createAttachment,
                      {
                        storageId,
                        messageId: userMessageId as MessageId,
                        name: attachment.name,
                        size: attachment.size,
                        mimeType: attachment.type,
                        sessionToken,
                      },
                    );

                    return attachmentId as string;
                  } catch (error) {
                    logger.error(
                      `Failed to upload attachment "${attachment.name}" (${attachment.type}): ${error}`,
                    );
                    return null;
                  }
                },
              );

              const uploadedAttachmentIds = await Promise.all(uploadPromises);
              const successfulUploads = uploadedAttachmentIds.filter(
                (id): id is string => id !== null,
              );

              // Combine existing and new attachment IDs for updating the message
              const allAttachmentIds = [
                ...existingAttachmentIds,
                ...successfulUploads,
              ];

              // Update message with all attachment IDs
              if (allAttachmentIds.length > 0) {
                await convexServer.mutation(
                  api.functions.message.updateUserMessage,
                  {
                    messageId: userMessageId as MessageId,
                    sessionToken,
                    attachments: allAttachmentIds.map(
                      (id) => id as AttachmentId,
                    ),
                  },
                );
              }
            } catch (error) {
              logger.error(
                `Failed to process attachments in background: ${error}`,
              );
            }
          })();
        }
      }
    }

    const selectedModel = requestedModelId
      ? getModelById(requestedModelId)
      : getDefaultModel();
    if (!selectedModel) {
      return new Response("Invalid model selection", { status: 400 });
    }

    const { provider, modelId } = selectedModel;

    logger.info(
      `Starting chat stream: ${chatId} (model: ${selectedModel.name}, search: ${search}${reasoningEffort ? `, reasoning: ${reasoningEffort}` : ""})`,
    );

    const providerOptions =
      reasoningEffort && selectedModel.reasoningEffort
        ? { openrouter: { reasoning: { effort: reasoningEffort } } }
        : undefined;

    const tools = search ? { webSearch } : undefined;
    const maxSteps = search ? 3 : 1;

    try {
      const result = streamText({
        model: openrouter.chat(modelId),
        system: getSystemPrompt(selectedModel, session.user.name, search),
        messages: transformedMessages,
        abortSignal: request.signal,
        ...(providerOptions ? { providerOptions } : {}),
        tools: tools,
        maxSteps: maxSteps,
      });

      const messageId = await createAiMessage({
        chatId,
        sessionToken,
        provider,
        model: selectedModel.name,
      });

      if (!messageId) {
        return new Response("Failed to create AI message", { status: 500 });
      }

      (async () => {
        try {
          await convexServer.mutation(api.functions.chat.updateChat, {
            chatId,
            model: selectedModel.modelId,
            provider,
            sessionToken,
          });
        } catch (err) {
          logger.warn(`Failed to update chat model metadata: ${err}`);
        }
      })();

      (async () => {
        let contentBuffer = "";
        const reasoningBuffer: MessageReasoning = {
          text: "",
          details: [],
          duration: 0,
          reasoningEffort,
        };
        let lastReasoningUpdate = Date.now();
        let usage: MessageUsage;
        let isAborted = false;
        let lastUpdate = Date.now();
        const UPDATE_INTERVAL = 300;

        try {
          for await (const part of result.fullStream) {
            const messageStatus = await getMessageStatus({
              messageId,
              sessionToken,
            });
            if (messageStatus === "aborted") {
              isAborted = true;
              break;
            }

            let isReasoning = false;

            if (part.type === "text-delta") {
              contentBuffer += part.textDelta;
            }
            if (part.type === "reasoning") {
              isReasoning = true;
              reasoningBuffer.text += part.textDelta;
              const steps = splitReasoningSteps(reasoningBuffer.text).map(
                (step) => ({ text: step }),
              );
              reasoningBuffer.details = steps;
              reasoningBuffer.duration += Date.now() - lastReasoningUpdate;
              lastReasoningUpdate = Date.now();
            }

            if (part.type === "finish") {
              usage = part.usage;
            }

            const steps = splitReasoningSteps(reasoningBuffer.text).map(
              (step) => ({ text: step }),
            );
            const completedReasoning =
              reasoningBuffer.text.length > 0
                ? {
                    text: reasoningBuffer.text,
                    details: steps,
                    duration: reasoningBuffer.duration,
                    reasoningEffort: reasoningEffort,
                  }
                : undefined;

            const now = Date.now();
            const isFinal = part.type === "finish";
            const shouldUpdate = isFinal || now - lastUpdate > UPDATE_INTERVAL;
            if (shouldUpdate) {
              lastUpdate = now;
              await updateAiMessage({
                messageId,
                content: contentBuffer,
                reasoning: completedReasoning,
                status: isReasoning ? "reasoning" : "generating",
                sessionToken,
              });
            }
          }

          if (isAborted) {
            logger.info(`Chat stream aborted by client: ${chatId}`);
            const steps = splitReasoningSteps(reasoningBuffer.text).map(
              (step) => ({ text: step }),
            );
            const completedReasoning =
              reasoningBuffer.text.length > 0
                ? {
                    text: reasoningBuffer.text,
                    details: steps,
                    duration: reasoningBuffer.duration,
                    reasoningEffort: reasoningEffort,
                  }
                : undefined;
            await updateAiMessage({
              messageId,
              content: contentBuffer,
              reasoning: completedReasoning,
              status: "aborted",
              sessionToken,
              model: selectedModel.name,
              provider,
              usage,
              historyEntry: {
                version: 1,
                content: contentBuffer,
                status: "aborted",
                reasoning: completedReasoning,
                provider,
                model: selectedModel.name,
                usage,
              },
            });
            return;
          }

          const steps = splitReasoningSteps(reasoningBuffer.text).map(
            (step) => ({ text: step }),
          );
          const completedReasoning =
            reasoningBuffer.text.length > 0
              ? {
                  text: reasoningBuffer.text,
                  details: steps,
                  duration: reasoningBuffer.duration,
                  reasoningEffort: reasoningEffort,
                }
              : undefined;
          await updateAiMessage({
            messageId,
            content: contentBuffer,
            reasoning: completedReasoning,
            status: "finished",
            sessionToken,
            model: selectedModel.name,
            provider,
            usage,
            historyEntry: {
              version: 1,
              content: contentBuffer,
              status: "finished",
              reasoning: completedReasoning,
              provider,
              model: selectedModel.name,
              usage,
            },
          });
        } catch (error) {
          if ((error as Error).name === "AbortError") {
            const steps = splitReasoningSteps(reasoningBuffer.text).map(
              (step) => ({ text: step }),
            );
            const completedReasoning =
              reasoningBuffer.text.length > 0
                ? {
                    text: reasoningBuffer.text,
                    details: steps,
                    duration: reasoningBuffer.duration,
                    reasoningEffort: reasoningEffort,
                  }
                : undefined;
            await updateAiMessage({
              messageId,
              content: contentBuffer,
              reasoning: completedReasoning,
              status: "aborted",
              sessionToken,
              model: selectedModel.name,
              provider,
              usage,
              historyEntry: {
                version: 1,
                content: contentBuffer,
                status: "aborted",
                reasoning: completedReasoning,
                provider,
                model: selectedModel.name,
                usage,
              },
            });
          } else {
            logger.error(
              `Failed to update AI message during streaming: ${error}`,
            );
          }
        }
      })();

      return result.toDataStreamResponse({
        sendReasoning: true,
      });
    } catch (error) {
      logger.error(`Chat streaming failed for ${chatId}: ${error}`);
      return new Response("Error streaming chat", { status: 500 });
    }
  },
});
