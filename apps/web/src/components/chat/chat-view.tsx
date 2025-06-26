import { useParams } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { useEffect } from "react";
import { ChatInput } from "~/components/chat/chat-input";
import { Message } from "~/components/chat/message";
import { useChat } from "~/hooks/use-chat";
import { useChatsList } from "~/hooks/use-chats-list";
import { authClient } from "~/lib/auth/client";
import { api } from "~/lib/db/server";
import { isConvexId } from "~/lib/db/utils";
import { models } from "~/lib/models";

export function ChatView() {
  const { data: session } = authClient.useSession();
  const params = useParams({ strict: false }) as { chatId?: string };
  const chatId = params?.chatId;
  const chatsList = useChatsList();
  const {
    messages,
    streamingMessage,
    status,
    append,
    stop,
    setSelectedModelId,
  } = useChat(chatId);
  const generateChatTitle = useMutation(api.functions.chat.generateChatTitle);

  // Restore model sync hook
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

  // Send first message hook
  useEffect(() => {
    async function sendFirstMessage() {
      const firstMessage = localStorage.getItem("firstMessage");
      if (chatId && isConvexId<"chat">(chatId) && firstMessage) {
        localStorage.removeItem("firstMessage");
        await generateChatTitle({
          message: firstMessage,
          chatId,
          sessionToken: session?.session.token ?? "skip",
        });
        await append({ role: "user", content: firstMessage });
      }
    }
    sendFirstMessage();
  }, [chatId, session?.session.token, append, generateChatTitle]);

  const isLoading = chatId && messages.length === 0;

  const showOptimisticMessage =
    streamingMessage?.role === "assistant" &&
    !messages.some(
      (m) =>
        m.role === "assistant" &&
        m.content === streamingMessage.content &&
        m.status === "finished",
    );

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="mb-16 flex-1 overflow-y-auto p-4">
        <div className="mx-auto h-full max-w-3xl space-y-4">
          {messages.length === 0 && !isLoading ? (
            <div className="flex h-full items-center justify-center text-foreground">
              <h1 className="text-2xl">Where should we begin?</h1>
            </div>
          ) : (
            messages.map((m, index) => {
              if (
                (m.role === "assistant" &&
                  status === "streaming" &&
                  index === messages.length - 1) ||
                m.status === "generating" ||
                m.status === "reasoning"
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
                    <div className="max-w-full text-foreground">
                      <Message data={m} />
                    </div>
                  )}
                </div>
              );
            })
          )}
          {showOptimisticMessage && (
            <div className="flex justify-start">
              <div className="max-w-full text-foreground">
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
        addUserMessage={(message) => append({ role: "user", content: message })}
        onStop={stop}
      />
    </div>
  );
}
