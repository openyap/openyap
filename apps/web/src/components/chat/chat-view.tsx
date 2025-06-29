import { useParams } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence } from "motion/react";
import { ChatInput } from "~/components/chat/chat-input";
import { Message, MemoizedMessage } from "~/components/chat/message";
import { ChatStatus } from "~/components/chat/types";
import { useChat } from "~/hooks/use-chat";
import { useChatsList } from "~/hooks/use-chats-list";
import { authClient } from "~/lib/auth/client";
import { api } from "~/lib/db/server";
import { isConvexId } from "~/lib/db/utils";
import { models } from "~/lib/models";
import { AnimatedShinyText } from "../ui/animated-shiny-text";
import { Button } from "~/components/ui/button";
import { ArrowDown } from "lucide-react";

export function ChatView() {
  const { data: session } = authClient.useSession();
  const params = useParams({ strict: false }) as { chatId?: string };
  const chatId = params?.chatId;
  const chatsList = useChatsList();
  const { messages, status, append, stop, setSelectedModelId } =
    useChat(chatId);
  const generateChatTitle = useMutation(api.functions.chat.generateChatTitle);
  const bottomRef = useRef<HTMLDivElement>(null);

  const [showScrollButton, setShowScrollButton] = useState(false);

  useEffect(() => {
    const element = bottomRef.current;

    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      setShowScrollButton(!entry.isIntersecting);
    });

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

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
                if (
                  status === ChatStatus.LOADING &&
                  index === messages.length - 1 &&
                  m.status !== "finished"
                )
                  return null;

                if (
                  status === ChatStatus.STREAMING &&
                  index === messages.length - 1
                )
                  return <Message key={m._id} data={m} user={session?.user} />;

                return (
                  <MemoizedMessage key={m._id} data={m} user={session?.user} />
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

      <div className="sticky bottom-36 flex justify-center z-50">
        <Button
          variant="secondary"
          size="icon"
          className={`transition-all duration-300 ${showScrollButton ? "opacity-100" : "opacity-0 pointer-events-none"} hover:bg-primary hover:text-primary-foreground`}
          onClick={() =>
            bottomRef.current?.scrollIntoView({ behavior: "smooth" })
          }
        >
          <ArrowDown className="size-4" />
        </Button>
      </div>
    </div>
  );
}
