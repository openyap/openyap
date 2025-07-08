import { useParams } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { ArrowDown } from "lucide-react";
import { AnimatePresence } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { ChatInput } from "~/components/chat/chat-input";
import { MemoizedMessage, Message } from "~/components/chat/message";
import { inputStore } from "~/components/chat/stores";
import { ChatStatus } from "~/components/chat/types";
import {
  ChatErrorBoundary,
  MessageErrorBoundary,
} from "~/components/error-boundary";
import { Button } from "~/components/ui/button";
import { useChat } from "~/hooks/use-chat";
import { useChatsList } from "~/hooks/use-chats-list";
import { authClient } from "~/lib/auth/client";
import { STORAGE_KEYS } from "~/lib/constants";
import { api } from "~/lib/db/server";
import { isConvexId } from "~/lib/db/utils";
import { models } from "~/lib/models";
import { AnimatedShinyText } from "../ui/animated-shiny-text";

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

  // TODO: fix first message attachments
  // Send first message hook
  useEffect(() => {
    async function sendFirstMessage() {
      const firstMessage = localStorage.getItem(STORAGE_KEYS.FIRST_MESSAGE);
      const firstMessageAttachments = inputStore
        .getState()
        .getPendingAttachments();

      if (
        chatId &&
        isConvexId<"chat">(chatId) &&
        (firstMessage !== null || firstMessageAttachments.length > 0)
      ) {
        if (firstMessage !== null) {
          localStorage.removeItem(STORAGE_KEYS.FIRST_MESSAGE);
        }
        if (firstMessageAttachments.length > 0) {
          inputStore.getState().clearFiles();
        }

        const titleMessage = firstMessage || "Shared an attachment";
        await generateChatTitle({
          message: titleMessage,
          chatId,
          sessionToken: session?.session.token ?? "skip",
        });
        await append({
          content: firstMessage || "",
          attachments: firstMessageAttachments,
        });
      }
    }
    sendFirstMessage();
  }, [chatId, session?.session.token, append, generateChatTitle]);

  const isEmpty = !chatId || messages.length === 0;

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="mt-5 mb-16 flex-1 p-4">
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
                  return (
                    <MessageErrorBoundary key={m._id}>
                      <Message data={m} user={session?.user} />
                    </MessageErrorBoundary>
                  );

                return (
                  <MessageErrorBoundary key={m._id}>
                    <MemoizedMessage data={m} user={session?.user} />
                  </MessageErrorBoundary>
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

      <div className="sticky bottom-0 z-10">
        <div className="relative px-4">
          <div className="-top-16 -translate-x-1/2 absolute left-1/2 z-20 transform">
            <Button
              variant="secondary"
              size="icon"
              className={`transition-all duration-300 ${showScrollButton ? "opacity-100" : "pointer-events-none opacity-0"} hover:bg-primary hover:text-primary-foreground`}
              onClick={() =>
                bottomRef.current?.scrollIntoView({ behavior: "smooth" })
              }
            >
              <ArrowDown className="size-4" />
            </Button>
          </div>
          <ChatErrorBoundary>
            <ChatInput
              chatId={chatId}
              sessionToken={session?.session.token ?? "skip"}
              disabled={status === "streaming"}
              addUserMessage={(message) => append({ content: message })}
              onStop={stop}
            />
          </ChatErrorBoundary>
        </div>
        <div className="h-4 bg-background" />
      </div>
    </div>
  );
}
