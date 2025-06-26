import {
  createServerFileRoute,
  getWebRequest,
} from "@tanstack/react-start/server";
import { streamText } from "ai";
import type { Id } from "convex/_generated/dataModel";
import type { MessageReasoning, MessageUsage } from "~/components/chat/types";
import { splitReasoningSteps } from "~/lib/ai/reasoning";
import { auth } from "~/lib/auth/server";
import { api, convexServer } from "~/lib/db/server";
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
  messageId: Id<"message">;
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
  messageId: Id<"message">;
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
    } = await request.json();

    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role === "user") {
      await convexServer.mutation(api.functions.message.createUserMessage, {
        chatId,
        content: lastMessage.content,
        sessionToken,
      });
    }

    const selectedModel = requestedModelId
      ? getModelById(requestedModelId)
      : getDefaultModel();
    if (!selectedModel) {
      return new Response("Invalid model selection", { status: 400 });
    }

    const { provider, modelId } = selectedModel;

    console.log(
      "[Chat API] Streaming Chat ID: ",
      chatId,
      "Model ID: ",
      modelId,
      "Search: ",
      search,
    );

    const appendedModelId = search ? `${modelId}:online` : modelId;

    console.log("[Chat API] Appended Model ID: ", appendedModelId);

    try {
      const result = streamText({
        model: openrouter.chat(appendedModelId),
        system: getSystemPrompt(selectedModel, session.user.name),
        messages,
        abortSignal: request.signal,
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
          console.warn("[Chat API] Failed to update chat model:", err);
        }
      })();

      (async () => {
        let contentBuffer = "";
        const reasoningBuffer: MessageReasoning = {
          text: "",
          details: [],
          duration: 0,
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
            console.log(
              "[Chat API] Stream finished, but client aborted. Marking as aborted.",
            );
            const steps = splitReasoningSteps(reasoningBuffer.text).map(
              (step) => ({ text: step }),
            );
            const completedReasoning =
              reasoningBuffer.text.length > 0
                ? {
                    text: reasoningBuffer.text,
                    details: steps,
                    duration: reasoningBuffer.duration,
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
            console.error("Error updating AI message in background:", error);
          }
        }
      })();

      return result.toDataStreamResponse({
        sendReasoning: true,
      });
    } catch (error) {
      console.error("Error streaming chat:", error);
      return new Response("Error streaming chat", { status: 500 });
    }
  },
});
