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
import { AnimatedShinyText } from "~/components/ui/animated-shiny-text";
import { Button } from "~/components/ui/button";
import { useChat } from "~/hooks/use-chat";
import { useChatsList } from "~/hooks/use-chats-list";
import { authClient } from "~/lib/auth/client";
import { STORAGE_KEYS } from "~/lib/constants";
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
    status,
    append,
    stop,
    setSelectedModelId,
    isLoadingMessages,
  } = useChat(chatId);
  const generateChatTitle = useMutation(api.functions.chat.generateChatTitle);
  const bottomRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const [showScrollButton, setShowScrollButton] = useState(false);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const checkScrollPosition = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 5;
      setShowScrollButton(!isAtBottom);
    };

    const handleScroll = () => {
      checkScrollPosition();
    };

    container.addEventListener("scroll", handleScroll);

    const observer = new MutationObserver(() => {
      setTimeout(checkScrollPosition, 0);
    });

    observer.observe(container, {
      childList: true,
      subtree: true,
    });

    checkScrollPosition();

    return () => {
      container.removeEventListener("scroll", handleScroll);
      observer.disconnect();
    };
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

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  const isEmpty = !chatId || (messages.length === 0 && !isLoadingMessages);

  return (
    <div className="relative h-screen bg-background">
      <div
        ref={messagesContainerRef}
        className="scrollbar scrollbar-thumb-border scrollbar-track-transparent hover:scrollbar-thumb-border/80 scrollbar-w-2 absolute inset-0 ml-4 overflow-y-auto p-4 pb-32"
      >
        {isEmpty ? (
          <div className="flex h-full items-center justify-center text-foreground">
            <h1 className="text-2xl">Where should we begin?</h1>
          </div>
        ) : (
          <div className="mx-auto max-w-[752px] space-y-3 pt-5">
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
            {status === ChatStatus.LOADING && (
              <div className="px-3 pt-2">
                <AnimatedShinyText>Loading</AnimatedShinyText>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <div className="absolute right-0 bottom-0 left-0 z-10">
        <div className="relative bg-gradient-to-t from-background via-background to-transparent px-4 pt-8 pb-4">
          <div className="-top-12 -translate-x-1/2 absolute left-1/2 z-20 transform">
            <Button
              variant="secondary"
              size="icon"
              className={`transition-all duration-300 ${showScrollButton ? "opacity-100" : "pointer-events-none opacity-0"} shadow-lg hover:bg-primary hover:text-primary-foreground`}
              onClick={scrollToBottom}
            >
              <ArrowDown className="size-4" />
            </Button>
          </div>
          <ChatErrorBoundary>
            <ChatInput
              chatId={chatId}
              sessionToken={session?.session.token ?? "skip"}
              disabled={status === "streaming"}
              addUserMessage={(message, attachments) =>
                append({ content: message, attachments })
              }
              onStop={stop}
            />
          </ChatErrorBoundary>
        </div>
      </div>
    </div>
  );
}
