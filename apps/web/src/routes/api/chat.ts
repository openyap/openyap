import {
  createServerFileRoute,
  getWebRequest,
} from "@tanstack/react-start/server";
import { waitUntil } from "@vercel/functions";
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
import { API_CONSTANTS, UI_CONSTANTS } from "~/lib/constants";
import { api, convexServer } from "~/lib/db/server";
import { logger } from "~/lib/logger";
import { getDefaultModel, getModelById, getSystemPrompt } from "~/lib/models";
import { openrouter } from "~/lib/openrouter";

// Types for better type safety
type AttachmentData = {
  name: string;
  size: number;
  type: string;
  data: string;
};

type ProcessedAttachment = {
  type: string;
  name: string;
  mimeType: string;
  url: string;
  extractedText?: string;
};

type AttachmentFromDb = {
  type: string;
  name: string;
  mimeType?: string;
  url: string;
  extractedText?: string;
};

type MessageContent = {
  type: string;
  text?: string;
  image?: string;
};

type StreamingState = {
  contentBuffer: string;
  reasoningBuffer: {
    text: string;
    details: { text: string }[];
    duration: number;
    reasoningEffort?: string;
  };
  lastReasoningDelta: string;
  lastReasoningUpdate: number;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  isAborted: boolean;
  lastUpdate: number;
};

// Database operations
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

// Attachment processing utilities
const separateAttachments = (attachments: (string | object)[]) => {
  const existingAttachmentIds = attachments.filter(
    (att) => typeof att === "string" && att.startsWith("k"),
  ) as string[];
  const newAttachments = attachments.filter(
    (att) => typeof att === "object" && att !== null && "data" in att,
  ) as AttachmentData[];
  return { existingAttachmentIds, newAttachments };
};

const fetchExistingAttachments = async (
  existingAttachmentIds: string[],
  sessionToken: string,
) => {
  return await Promise.all(
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
};

const processAttachmentsForAI = (
  existingAttachmentsData: (AttachmentFromDb | null)[],
  newAttachments: AttachmentData[],
): ProcessedAttachment[] => {
  return [
    ...existingAttachmentsData
      .filter((att): att is AttachmentFromDb => att !== null)
      .map((att) => ({
        type: att.type,
        name: att.name,
        mimeType: att.mimeType || "application/octet-stream",
        url: att.url,
        extractedText: att.extractedText,
      })),
    ...newAttachments.map((att) => ({
      type: att.type.startsWith("image/") ? "image" : "document",
      name: att.name,
      mimeType: att.type,
      url: `data:${att.type};base64,${att.data}`,
      extractedText: undefined,
    })),
  ];
};

const transformMessageWithAttachments = (
  lastMessage: { content: string; [key: string]: unknown },
  allAttachmentsForAI: ProcessedAttachment[],
) => {
  const messageContent: MessageContent[] = [];

  // Add text content if it exists
  if (lastMessage.content.trim()) {
    messageContent.push({ type: "text", text: lastMessage.content });
  }

  for (const attachment of allAttachmentsForAI) {
    if (attachment.type === "image") {
      messageContent.push({
        type: "image",
        image: attachment.url,
      });
    } else if (attachment.type === "pdf" || attachment.type === "document") {
      // For text-based documents, include as text reference
      messageContent.push({
        type: "text",
        text: `[File: ${attachment.name} (${attachment.mimeType})]${
          attachment.extractedText
            ? `\n\nContent:\n${attachment.extractedText}`
            : ""
        }`,
      });
    }
  }

  return messageContent;
};

const convertBase64ToBlob = (base64Data: string, mimeType: string): Blob => {
  const binary = atob(base64Data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mimeType });
};

const uploadSingleAttachment = async (
  attachment: AttachmentData,
  userMessageId: MessageId,
  sessionToken: string,
): Promise<string | null> => {
  try {
    // Generate upload URL
    const uploadUrl = await convexServer.mutation(
      api.functions.attachment.generateUploadUrl,
      { sessionToken },
    );

    // Convert base64 to blob
    const blob = convertBase64ToBlob(attachment.data, attachment.type);

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
        messageId: userMessageId,
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
};

const processAttachmentsInBackground = async (
  newAttachments: AttachmentData[],
  userMessageId: MessageId,
  existingAttachmentIds: string[],
  sessionToken: string,
) => {
  try {
    const uploadPromises = newAttachments.map((attachment) =>
      uploadSingleAttachment(attachment, userMessageId, sessionToken),
    );

    const uploadedAttachmentIds = await Promise.all(uploadPromises);
    const successfulUploads = uploadedAttachmentIds.filter(
      (id): id is string => id !== null,
    );

    // Combine existing and new attachment IDs for updating the message
    const allAttachmentIds = [...existingAttachmentIds, ...successfulUploads];

    // Update message with all attachment IDs
    if (allAttachmentIds.length > 0) {
      await convexServer.mutation(api.functions.message.updateUserMessage, {
        messageId: userMessageId,
        sessionToken,
        attachments: allAttachmentIds.map((id) => id as AttachmentId),
      });
    }
  } catch (error) {
    logger.error(`Failed to process attachments in background: ${error}`);
  }
};

const updateChatMetadata = async (
  chatId: Id<"chat">,
  modelId: string,
  provider: string,
  sessionToken: string,
) => {
  try {
    await convexServer.mutation(api.functions.chat.updateChat, {
      chatId,
      model: modelId,
      provider,
      sessionToken,
    });
  } catch (err) {
    logger.warn(`Failed to update chat model metadata: ${err}`);
  }
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
    let transformedMessages = messages;

    if (lastMessage.role === "user") {
      const userMessageId = await convexServer.mutation(
        api.functions.message.createUserMessage,
        {
          chatId,
          content: lastMessage.content,
          sessionToken,
        },
      );

      // Transform messages with attachment content for AI model
      if (attachments.length > 0) {
        const { existingAttachmentIds, newAttachments } =
          separateAttachments(attachments);

        // Fetch existing attachments data if any
        const existingAttachmentsData = await fetchExistingAttachments(
          existingAttachmentIds,
          sessionToken,
        );

        // Combine all attachments for message transformation
        const allAttachmentsForAI = processAttachmentsForAI(
          existingAttachmentsData,
          newAttachments,
        );

        // Transform last message to include attachments for AI
        if (allAttachmentsForAI.length > 0) {
          const messageContent = transformMessageWithAttachments(
            lastMessage,
            allAttachmentsForAI,
          );

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
          waitUntil(
            processAttachmentsInBackground(
              newAttachments,
              userMessageId,
              existingAttachmentIds,
              sessionToken,
            ),
          );
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
        return new Response("Failed to create AI message", {
          status: API_CONSTANTS.STATUS_CODES.INTERNAL_SERVER_ERROR,
        });
      }

      waitUntil(
        updateChatMetadata(
          chatId,
          selectedModel.modelId,
          provider,
          sessionToken,
        ),
      );

      // Start streaming processing in the background
      waitUntil(
        processStreamingResponse(
          result,
          messageId,
          sessionToken,
          reasoningEffort,
          selectedModel,
          provider,
          chatId,
        ),
      );

      return result.toDataStreamResponse({
        sendReasoning: true,
      });
    } catch (error) {
      logger.error(`Chat streaming failed for ${chatId}: ${error}`);
      return new Response("Error streaming chat", {
        status: API_CONSTANTS.STATUS_CODES.INTERNAL_SERVER_ERROR,
      });
    }
  },
});

// Streaming response processing
const processStreamingResponse = async (
  // biome-ignore lint/suspicious/noExplicitAny: no easy way to type this
  result: any,
  messageId: MessageId,
  sessionToken: string,
  reasoningEffort: string | undefined,
  selectedModel: ReturnType<typeof getModelById>,
  provider: string,
  _chatId: Id<"chat">,
) => {
  const state: StreamingState = {
    contentBuffer: "",
    reasoningBuffer: {
      text: "",
      details: [],
      duration: 0,
      reasoningEffort,
    },
    lastReasoningDelta: "",
    lastReasoningUpdate: 0,
    usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
    isAborted: false,
    lastUpdate: 0,
  };

  const processReasoning = (textDelta: string) => {
    const cleanedDelta = textDelta?.replace(/\0/g, "") || "";
    state.reasoningBuffer.text = cleanedDelta;
    const steps = splitReasoningSteps(cleanedDelta);
    state.reasoningBuffer.details = steps.map((step) => ({ text: step }));
    state.lastReasoningDelta = cleanedDelta;
    state.lastReasoningUpdate = Date.now();
  };

  const shouldUpdateMessage = () => {
    const now = Date.now();
    return (
      now - state.lastUpdate > UI_CONSTANTS.POLLING_INTERVALS.UPDATE_INTERVAL ||
      now - state.lastReasoningUpdate >
        UI_CONSTANTS.POLLING_INTERVALS.SLOW_UPDATE
    );
  };

  const updateMessage = async (status = "streaming") => {
    if (!shouldUpdateMessage() && status === "streaming") return;

    const currentReasoning =
      state.reasoningBuffer.details.length > 0
        ? state.reasoningBuffer
        : undefined;
    const currentUsage = state.usage.totalTokens > 0 ? state.usage : undefined;

    await updateAiMessage({
      messageId,
      content: state.contentBuffer,
      reasoning: currentReasoning,
      status,
      model: selectedModel?.name,
      provider,
      usage: currentUsage,
      sessionToken,
    });

    state.lastUpdate = Date.now();
  };

  try {
    for await (const chunk of result.fullStream) {
      switch (chunk.type) {
        case "text-delta":
          state.contentBuffer += chunk.textDelta;
          await updateMessage();
          break;

        case "reasoning":
          processReasoning(chunk.textDelta);
          await updateMessage();
          break;

        case "tool-call":
          logger.info(`Tool call: ${chunk.toolName}`);
          break;

        case "error":
          logger.error(`Streaming error: ${chunk.error}`);
          state.isAborted = true;
          break;

        case "finish":
          logger.info(`Streaming finished: ${chunk.finishReason}`);
          break;

        default:
          break;
      }
    }

    // Final update
    if (!state.isAborted) {
      const messageStatus = await getMessageStatus({ messageId, sessionToken });
      if (messageStatus === "streaming") {
        await updateMessage("completed");
        logger.info(`Message completed: ${messageId}`);
      }
    }
  } catch (error) {
    logger.error(`Streaming processing failed: ${error}`);
    state.isAborted = true;
    const messageStatus = await getMessageStatus({ messageId, sessionToken });
    if (messageStatus === "streaming") {
      await updateMessage("failed");
    }
  }
};
