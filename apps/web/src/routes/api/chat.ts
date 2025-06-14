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
  status,
  model,
  provider,
  historyEntry,
  sessionToken,
}: {
  messageId: Id<"message">;
  content: string;
  status: string;
  sessionToken: string;
  model?: string;
  provider?: string;
  historyEntry?: {
    version: number;
    content: string;
    provider: string;
    model: string;
  };
}) => {
  await convexServer.mutation(api.functions.message.updateAiMessage, {
    messageId,
    content,
    status,
    model,
    provider,
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
    } = await request.json();

    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role === "user") {
      await convexServer.mutation(api.functions.message.generateUserMessage, {
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

    const messageId = await createAiMessage({
      chatId,
      sessionToken,
      provider,
      model: selectedModel.name,
    });

    if (!messageId) {
      return new Response("Failed to create AI message", { status: 500 });
    }

    console.log(
      "[Chat API] Streaming Chat ID: ",
      chatId,
      "Model ID: ",
      modelId
    );

    const result = streamText({
      model: openrouter.chat(modelId),
      system: getSystemPrompt(selectedModel, session.user.name),
      messages,
    });

    (async () => {
      let buffer = "";
      let lastUpdate = Date.now();
      const UPDATE_INTERVAL_MS = 500;

      try {
        for await (const chunk of result.textStream) {
          buffer += chunk;
          if (Date.now() - lastUpdate > UPDATE_INTERVAL_MS) {
            await updateAiMessage({
              messageId,
              content: buffer,
              status: "generating",
              sessionToken,
            });
            lastUpdate = Date.now();
          }
        }
        await updateAiMessage({
          messageId,
          content: buffer,
          status: "finished",
          sessionToken,
          model: selectedModel.name,
          provider,
          historyEntry: {
            version: 1,
            content: buffer,
            provider,
            model: selectedModel.name,
          },
        });
      } catch (error) {
        console.error("Error updating AI message in background:", error);
      }
    })();

    return result.toDataStreamResponse();
  },
});
