import { useParams } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { ArrowDown } from "lucide-react";
import { AnimatePresence } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { ChatInput } from "~/components/chat/chat-input";
import { MemoizedMessage, Message } from "~/components/chat/message";
import { ChatStatus } from "~/components/chat/types";
import { Button } from "~/components/ui/button";
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
      const firstMessage = localStorage.getItem("firstMessage");
      const firstMessageAttachments = localStorage.getItem(
        "firstMessageAttachments",
      );

      if (
        chatId &&
        isConvexId<"chat">(chatId) &&
        (firstMessage !== null || firstMessageAttachments)
      ) {
        // Handle first message attachments
        if (firstMessageAttachments) {
          localStorage.removeItem("firstMessageAttachments");
          const attachedFiles = JSON.parse(firstMessageAttachments);

          // Convert attached files to base64 format for API
          const attachmentPromises = attachedFiles.map(
            async (attachedFile: {
              file: {
                name: string;
                size: number;
                type: string;
                arrayBuffer: () => Promise<ArrayBuffer>;
              };
            }) => {
              const buffer = await attachedFile.file.arrayBuffer();
              const base64 = btoa(
                String.fromCharCode(...new Uint8Array(buffer)),
              );
              return {
                name: attachedFile.file.name,
                size: attachedFile.file.size,
                type: attachedFile.file.type,
                data: base64,
              };
            },
          );

          const attachmentData = await Promise.all(attachmentPromises);
          sessionStorage.setItem(
            "pendingAttachments",
            JSON.stringify(attachmentData),
          );
        }

        if (firstMessage !== null) {
          localStorage.removeItem("firstMessage");
        }

        const titleMessage = firstMessage || "Shared an attachment";
        await generateChatTitle({
          message: titleMessage,
          chatId,
          sessionToken: session?.session.token ?? "skip",
        });
        await append({ content: firstMessage || "" });
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

      <div className="sticky bottom-0 z-10 bg-background pb-4">
        <div className="relative">
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
          <ChatInput
            chatId={chatId}
            sessionToken={session?.session.token ?? "skip"}
            disabled={status === "streaming"}
            addUserMessage={(message) => append({ content: message })}
            onStop={stop}
          />
        </div>
      </div>
    </div>
  );
}
