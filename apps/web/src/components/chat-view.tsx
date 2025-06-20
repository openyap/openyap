import { useParams } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { authClient } from "~/lib/auth/client";
import { api } from "~/lib/db/server";
import { useChatsList } from "~/hooks/useChatsList";
import { useCallback, useEffect, useState } from "react";
import { usePersisted } from "~/hooks/usePersisted";
import { models } from "~/lib/models";
import type { ToggleState } from "~/components/chat/chat-toggles";
import type { Id } from "convex/_generated/dataModel";
import { Message } from "~/components/message";
import { MODEL_PERSIST_KEY } from "~/components/chat/model-selector";
import { getDefaultModel } from "~/lib/models";
import { isConvexId } from "~/lib/db/utils";
import { ChatInput } from "~/components/chat/chat-input";
import type {
  ChatMessage,
  MessageReasoning,
  StreamingMessage,
} from "~/components/chat/types";

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

  const { value: toggles, reset: resetToggles } = usePersisted<ToggleState>(
    "chat-toggle-options",
    {
      search: false,
    }
  );

  const updateChat = useMutation(api.functions.chat.updateChat);
  const updateUserMessage = useMutation(
    api.functions.message.updateUserMessage
  );
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

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          body: JSON.stringify({
            chatId,
            modelId: selectedModelId,
            messages: [...messages, { role, content }],
            search: toggles.search,
          }),
        });

        if (!response.ok || !response.body) {
          throw new Error("Failed to append message");
        }

        resetToggles();

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
        console.error(error);
        updateUserMessage({
          messageId: messages[messages.length]._id,
          error: "Failed to generate message",
        });
      } finally {
        setStatus("idle");
      }
    },
    [
      chatId,
      selectedModelId,
      messages,
      toggles.search,
      updateUserMessage,
      resetToggles,
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
    <div className="flex flex-col h-full bg-background">
      <div className="flex-1 overflow-y-auto p-4 mb-16">
        <div className="max-w-4xl mx-auto space-y-4 h-full">
          {messages.length === 0 && !isLoading ? (
            <div className="flex items-center justify-center text-foreground h-full">
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
                    <div className="max-w-[70%] rounded-lg px-4 py-2 border bg-sidebar-accent text-sidebar-accent-foreground border-border ml-auto">
                      <Message data={m} />
                      {m.error && (
                        <div className="text-red-500 text-xs">{m.error}</div>
                      )}
                    </div>
                  ) : (
                    <div className="text-foreground max-w-[70%]">
                      <Message data={m} />
                    </div>
                  )}
                </div>
              );
            })
          )}
          {showOptimisticMessage && (
            <div className="flex justify-start">
              <div className="text-foreground max-w-[70%]">
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
      />
    </div>
  );
}
