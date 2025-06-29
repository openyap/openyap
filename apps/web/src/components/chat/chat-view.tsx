import { useParams } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { useEffect, useRef } from "react";
import { AnimatePresence } from "motion/react";
import { ChatInput } from "~/components/chat/chat-input";
import { Message, MemoizedMessage} from "~/components/chat/message";
import { ChatStatus } from "~/components/chat/types";
import { useChat } from "~/hooks/use-chat";
import { useChatsList } from "~/hooks/use-chats-list";
import { authClient } from "~/lib/auth/client";
import { api } from "~/lib/db/server";
import { isConvexId } from "~/lib/db/utils";
import { models } from "~/lib/models";
import { AnimatedShinyText } from "../ui/animated-shiny-text";

export function ChatView() {
  const { data: session } = authClient.useSession();
  const params = useParams({ strict: false }) as { chatId?: string };
  const chatId = params?.chatId;
  const chatsList = useChatsList();
  const {
    messages,
    status,
    append,
    stop,
    setSelectedModelId,
  } = useChat(chatId);
  const generateChatTitle = useMutation(api.functions.chat.generateChatTitle);
  const bottomRef = useRef<HTMLDivElement>(null);

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
        await append({ content: firstMessage });
      }
    }
    sendFirstMessage();
  }, [chatId, session?.session.token, append, generateChatTitle]);

  const isEmpty = !chatId || messages.length === 0;

  useEffect(() => {
    if (messages.length === 0 || status !== ChatStatus.LOADING) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, status]);

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="mb-16 flex-1 p-4 mt-5">
        <div className="mx-auto h-full max-w-3xl space-y-3">
          {isEmpty ? (
            <div className="flex h-full items-center justify-center text-foreground">
              <h1 className="text-2xl">Where should we begin?</h1>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {messages.map((m, index) => {
                if (status === ChatStatus.LOADING && index === messages.length - 1 && m.status !== "finished") return null;

                if (status === ChatStatus.STREAMING && index === messages.length - 1) return (
                  <Message
                    key={m._id}
                    data={m}
                    user={session?.user}
                  />
                );

                return (
                  <MemoizedMessage
                    key={m._id}
                    data={m}
                    user={session?.user}
                  />
                );
              })}
            </AnimatePresence>
          )}
          {status === ChatStatus.LOADING && (
            <div className="px-3 pt-2">
              <AnimatedShinyText>Loading</AnimatedShinyText>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>
      <ChatInput
        chatId={chatId}
        sessionToken={session?.session.token ?? "skip"}
        disabled={status === "streaming"}
        addUserMessage={(message) => append({ content: message })}
        onStop={stop}
      />
    </div>
  );
}
