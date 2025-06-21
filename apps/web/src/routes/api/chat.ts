import {
  createServerFileRoute,
  getWebRequest,
} from "@tanstack/react-start/server";
import { openrouter } from "~/lib/openrouter";
import { streamText } from "ai";
import { auth } from "~/lib/auth/server";
import { api, convexServer } from "~/lib/db/server";
import { getModelById, getDefaultModel, getSystemPrompt } from "~/lib/models";
import type { Id } from "convex/_generated/dataModel";
import type { MessageReasoning, MessageUsage } from "~/components/chat/types";

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
  reasoning?: {
    steps: {
      text: string;
      duration?: number;
    }[];
    duration?: number;
  };
  status: string;
  sessionToken: string;
  model?: string;
  provider?: string;
  usage?: MessageUsage;
  historyEntry?: {
    version: number;
    content: string;
    status: string;
    reasoning?: {
      steps: {
        text: string;
        duration?: number;
      }[];
      duration?: number;
    };
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

export const ServerRoute = createServerFileRoute("/api/chat").methods({
  GET: ({ request }) => {
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
      search
    );

    const appendedModelId = search ? `${modelId}:online` : modelId;

    console.log("[Chat API] Appended Model ID: ", appendedModelId);

    try {
      const result = streamText({
        model: openrouter.chat(appendedModelId),
        system: getSystemPrompt(selectedModel, session.user.name),
        messages,
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
          steps: [],
        };
        let lastReasoningUpdate = Date.now();
        let lastUpdate = Date.now();
        let usage: MessageUsage;
        const UPDATE_INTERVAL_MS = 500;

        try {
          for await (const part of result.fullStream) {
            let isReasoning = false;

            if (part.type === "text-delta") {
              contentBuffer += part.textDelta;
            }
            if (part.type === "reasoning") {
              isReasoning = true;
              reasoningBuffer.steps.push({
                text: part.textDelta,
                duration: Date.now() - lastReasoningUpdate,
              });
              lastReasoningUpdate = Date.now();
            }

            if (part.type === "finish") {
              usage = part.usage;
            }

            if (Date.now() - lastUpdate > UPDATE_INTERVAL_MS) {
              lastUpdate = Date.now();
              const completedReasoning = reasoningBuffer.steps.length > 0 ? {
                steps: reasoningBuffer.steps,
                duration: reasoningBuffer.steps.reduce((acc, step) => acc + (step.duration ?? 0), 0),
              } : undefined;
              void updateAiMessage({
                messageId,
                content: contentBuffer,
                reasoning: completedReasoning,
                status: isReasoning ? "reasoning" : "generating",
                sessionToken,
              });
            }
          }

          // TODO: Add usage
          const completedReasoning = reasoningBuffer.steps.length > 0 ? {
            steps: reasoningBuffer.steps,
            duration: reasoningBuffer.steps.reduce((acc, step) => acc + (step.duration ?? 0), 0),
          } : undefined;
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
          console.error("Error updating AI message in background:", error);
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
