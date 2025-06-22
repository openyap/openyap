import { useParams } from "@tanstack/react-router";
import type { Id } from "convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useCallback, useEffect, useState } from "react";
import { ChatInput } from "~/components/chat/chat-input";
import { MODEL_PERSIST_KEY } from "~/components/chat/model-selector";
import type {
  ChatMessage,
  MessageReasoning,
  StreamingMessage,
} from "~/components/chat/types";
import { Message } from "~/components/message";
import { useChatsList } from "~/hooks/useChatsList";
import { usePersisted } from "~/hooks/usePersisted";
import { authClient } from "~/lib/auth/client";
import { api } from "~/lib/db/server";
import { isConvexId } from "~/lib/db/utils";
import { models } from "~/lib/models";
import { getDefaultModel } from "~/lib/models";

export function ChatView() {
  const { data: session } = authClient.useSession();
  const params = useParams({ strict: false }) as { chatId?: string };
  const chatId = params?.chatId;

  const { value: selectedModelId, set: setSelectedModelId } =
    usePersisted<number>(MODEL_PERSIST_KEY, getDefaultModel().id);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streamingMessage, setStreamingMessage] =
    useState<StreamingMessage | null>(null);
  const [status, setStatus] = useState<"streaming" | "idle">("idle");
  const [abortController, setAbortController] =
    useState<AbortController | null>(null);

  const { value: searchEnabled, reset: resetSearchToggle } =
    usePersisted<boolean>("search-toggle", false);

  const updateChat = useMutation(api.functions.chat.updateChat);
  const updateUserMessage = useMutation(
    api.functions.message.updateUserMessage
  );
  const updateAiMessage = useMutation(api.functions.message.updateAiMessage);
  const getChatMessages = useQuery(
    api.functions.chat.getChatMessages,
    isConvexId<"chat">(chatId)
      ? { chatId: chatId, sessionToken: session?.session.token }
      : "skip"
  );

  const chatsList = useChatsList();

  useEffect(() => {
    if (!chatId || !chatsList.data) return;

    const chat = (
      chatsList.data as Array<{ _id: string; model?: string }>
    ).find((c) => c._id === chatId);

    if (chat?.model) {
      const model = models.find((m) => m.modelId === chat.model);
      if (model) {
        setSelectedModelId((prev) => (prev === model.id ? prev : model.id));
      }
    }
  }, [chatId, chatsList.data, setSelectedModelId]);

  useEffect(() => {
    if (getChatMessages) {
      setMessages(getChatMessages);
    }
  }, [getChatMessages]);

  const append = useCallback(
    async ({
      role,
      content,
    }: {
      role: "user" | "data" | "system" | "assistant";
      content: string;
    }) => {
      // TODO: check if chat exists
      if (!isConvexId<"chat">(chatId)) {
        return;
      }

      setStatus("streaming");
      setStreamingMessage({
        chatId,
        role,
        content,
        status: "streaming",
      });

      const controller = new AbortController();
      setAbortController(controller);

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          signal: controller.signal,
          body: JSON.stringify({
            chatId,
            modelId: selectedModelId,
            messages: [...messages, { role, content }],
            search: searchEnabled,
          }),
        });

        if (!response.ok || !response.body) {
          throw new Error("Failed to append message");
        }

        resetSearchToggle();

        const reader = response.body.getReader();
        let contentBuffer = "";
        const reasoningBuffer: MessageReasoning = {
          steps: [],
        };

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = new TextDecoder().decode(value);
          const lines = chunk.split("\n").filter((line) => line.length > 0);
          let isReasoning = false;

          for (const line of lines) {
            const prefix = line.slice(0, 1);
            const content = line.slice(2);

            switch (prefix) {
              case "f":
                break;
              case "g":
                isReasoning = true;
                reasoningBuffer.steps.push({
                  text: JSON.parse(content),
                });
                break;
              case "0":
                contentBuffer += JSON.parse(content);
                break;
              case "e":
                break;
              case "d":
                break;
              default:
                break;
            }
          }

          const completedReasoning =
            reasoningBuffer.steps.length > 0
              ? {
                  steps: reasoningBuffer.steps,
                }
              : undefined;
          setStreamingMessage({
            chatId,
            role: "assistant",
            content: contentBuffer,
            reasoning: completedReasoning,
            status: isReasoning ? "reasoning" : "generating",
          });
        }

        const completedReasoning =
          reasoningBuffer.steps.length > 0
            ? {
                steps: reasoningBuffer.steps,
              }
            : undefined;
        setStreamingMessage({
          chatId,
          role: "assistant",
          content: contentBuffer,
          reasoning: completedReasoning,
          status: "finished",
        });
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          setStreamingMessage((prev) =>
            prev
              ? {
                  ...prev,
                  status: "aborted",
                }
              : null
          );
        } else {
          console.error(error);
          updateUserMessage({
            messageId: messages[messages.length - 1]._id,
            error: "Failed to generate message",
            sessionToken: session?.session.token ?? "skip",
          });
        }
      } finally {
        setStatus("idle");
        setAbortController(null);
      }
    },
    [
      chatId,
      selectedModelId,
      messages,
      searchEnabled,
      updateUserMessage,
      resetSearchToggle,
      session?.session.token,
    ]
  );

  useEffect(() => {
    async function sendFirstMessage() {
      const firstMessage = localStorage.getItem("firstMessage");
      if (chatId && firstMessage) {
        localStorage.removeItem("firstMessage");
        await append({ role: "user", content: firstMessage });

        const response = await fetch("/api/generateChatTitle", {
          method: "POST",
          body: JSON.stringify({ message: firstMessage }),
        });
        const { title } = await response.json();
        await updateChat({
          chatId: chatId as Id<"chat">,
          title,
          sessionToken: session?.session.token ?? "skip",
        });
      }
    }
    sendFirstMessage();
  }, [chatId, session?.session.token, updateChat, append]);

  const addUserMessage = useCallback(
    (message: string) => {
      append({ role: "user", content: message });
    },
    [append]
  );

  const handleStop = useCallback(() => {
    if (abortController) {
      updateAiMessage({
        messageId: messages[messages.length - 1]._id,
        status: "aborted",
        sessionToken: session?.session.token ?? "skip",
      });
      abortController.abort();
    }
  }, [abortController, messages, updateAiMessage, session?.session.token]);

  const isLoading = chatId && getChatMessages === undefined;

  const showOptimisticMessage =
    streamingMessage?.role === "assistant" &&
    !messages.some(
      (m) =>
        m.role === "assistant" &&
        m.content === streamingMessage.content &&
        m.status === "finished"
    );

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="mb-16 flex-1 overflow-y-auto p-4">
        <div className="mx-auto h-full max-w-4xl space-y-4">
          {messages.length === 0 && !isLoading ? (
            <div className="flex h-full items-center justify-center text-foreground">
              <h1 className="text-2xl">Where should we begin?</h1>
            </div>
          ) : (
            messages.map((m) => {
              if (
                m.role === "assistant" &&
                (m.status === "generating" || m.status === "reasoning")
              ) {
                return null;
              }

              return (
                <div
                  key={m._id}
                  className={`flex ${
                    m.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {m.role === "user" ? (
                    <div className="ml-auto max-w-[70%] rounded-lg border border-border bg-sidebar-accent px-4 py-2 text-sidebar-accent-foreground">
                      <Message data={m} />
                      {m.error && (
                        <div className="text-red-500 text-xs">{m.error}</div>
                      )}
                    </div>
                  ) : (
                    <div className="max-w-[70%] text-foreground">
                      <Message data={m} />
                    </div>
                  )}
                </div>
              );
            })
          )}
          {showOptimisticMessage && (
            <div className="flex justify-start">
              <div className="max-w-[70%] text-foreground">
                <Message data={streamingMessage} />
              </div>
            </div>
          )}
        </div>
      </div>

      <ChatInput
        chatId={chatId}
        sessionToken={session?.session.token ?? "skip"}
        disabled={status === "streaming"}
        addUserMessage={addUserMessage}
        onStop={handleStop}
      />
    </div>
  );
}
