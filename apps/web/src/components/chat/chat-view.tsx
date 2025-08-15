import { useParams } from "@tanstack/react-router";
import { ArrowDown, LogIn } from "lucide-react";
import { AnimatePresence } from "motion/react";
import { useEffect, useState, useTransition } from "react";
import { CaptchaWidget } from "~/components/auth/captcha-widget";
import { ChatInput } from "~/components/chat/chat-input";
import { MemoizedMessage, Message } from "~/components/chat/message";
import { ChatStatus, MessageStatus } from "~/components/chat/types";
import { DomainLogo } from "~/components/domains";
import {
  ChatErrorBoundary,
  MessageErrorBoundary,
} from "~/components/error-boundary";
import { Button } from "~/components/ui/button";
import { useChat } from "~/hooks/use-chat";
import { useChatScroll } from "~/hooks/use-chat-scroll";
import { useChatsList } from "~/hooks/use-chats-list";
import { useFirstMessage } from "~/hooks/use-first-message";
import { authClient, getClientIP } from "~/lib/auth/client";
import { logger } from "~/lib/logger";
import { models } from "~/lib/models";

export function ChatView() {
  const { data: session, isPending: isSessionPending } =
    authClient.useSession();
  const [isPending, startTransition] = useTransition();
  const [captchaToken, setCaptchaToken] = useState<string>("");
  const params = useParams({ strict: false }) as { chatId?: string };
  const chatId = params?.chatId;
  const chatsList = useChatsList();
  const {
    messages,
    status,
    append,
    regenerate,
    stop,
    setSelectedModelId,
    isLoadingMessages,
  } = useChat(chatId);

  const { messagesContainerRef, bottomRef, showScrollButton, scrollToBottom } =
    useChatScroll();

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
    if (messages.length > 0 && messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  }, [messages.length, messagesContainerRef]);

  useFirstMessage({
    chatId,
    sessionToken: session?.session.token,
    append,
  });

  const handleGoogleLogin = async () => {
    startTransition(async () => {
      const ipAddress = await getClientIP();
      try {
        const { error } = await authClient.signIn.social({
          provider: "google",
          callbackURL: "/",
          fetchOptions: {
            headers: {
              "x-captcha-response": captchaToken,
              "x-captcha-user-remote-ip": ipAddress ?? "",
            },
          },
        });
        if (error) {
          logger.error(
            `Google OAuth sign-in failed: ${error.message || "Unknown error"}`,
          );
          return;
        }
      } catch (error: unknown) {
        logger.error(
          `Google OAuth request failed: ${error instanceof Error ? error.message : "Network or configuration error"}`,
        );
        return;
      }
    });
  };

  const handleCaptchaSuccess = (token: string) => {
    setCaptchaToken(token);
  };

  const handleCaptchaError = (error: string) => {
    logger.error(`CAPTCHA validation failed: ${error}`);
  };

  const isEmpty = !chatId || (messages.length === 0 && !isLoadingMessages);

  if (!session?.user && !isSessionPending) {
    return (
      <div className="relative flex h-dvh flex-col overflow-hidden bg-background md:h-screen">
        <div className="flex h-full items-center justify-center p-4">
          <div className="flex max-w-md flex-col items-center gap-6 text-center">
            <div className="rounded-full bg-primary/10 p-4">
              <LogIn className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-2">
              <h1 className="font-semibold text-2xl">Sign in to OpenYap</h1>
              <p className="text-muted-foreground">
                Sign in with your Google account to start yapping
              </p>
            </div>
            <Button
              size="lg"
              variant="default"
              onClick={handleGoogleLogin}
              disabled={isPending}
              className="flex w-full items-center gap-3"
            >
              <DomainLogo domain="google.com" config={{ type: "symbol" }} />
              <span>Continue with Google</span>
            </Button>
            <CaptchaWidget
              onSuccess={handleCaptchaSuccess}
              onError={handleCaptchaError}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden bg-background md:h-screen">
      <div
        ref={messagesContainerRef}
        className="scrollbar scrollbar-thumb-border scrollbar-track-transparent hover:scrollbar-thumb-border/80 scrollbar-w-2 ml-4 min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 pb-2"
      >
        {isEmpty ? (
          <div className="flex h-full items-center justify-center text-foreground">
            <h1 className="text-2xl">Where should we begin?</h1>
          </div>
        ) : (
          <div className="mx-auto max-w-[752px] space-y-3 pt-5">
            <AnimatePresence initial={false}>
              {messages.map((m, index) => {
                const handleMessageEdit = (editedContent: string) => {
                  // Only regenerate if this is a user message
                  if (m.role === "user") {
                    // Trigger AI regeneration from the edited message with the new content
                    regenerate(m._id, editedContent);
                  }
                };

                if (
                  status === ChatStatus.STREAMING &&
                  index === messages.length - 1 &&
                  m.status !== MessageStatus.COMPLETED
                )
                  return (
                    <MessageErrorBoundary key={m._id}>
                      <Message
                        data={m}
                        user={session?.user}
                        onMessageEdit={handleMessageEdit}
                      />
                    </MessageErrorBoundary>
                  );

                return (
                  <MessageErrorBoundary key={m._id}>
                    <MemoizedMessage
                      data={m}
                      user={session?.user}
                      onMessageEdit={handleMessageEdit}
                    />
                  </MessageErrorBoundary>
                );
              })}
            </AnimatePresence>
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <div className="relative z-10 shrink-0">
        <div className="relative bg-gradient-to-t from-background via-background to-transparent px-4 [padding-bottom:calc(1rem+env(safe-area-inset-bottom))]">
          <div className="-top-12 -translate-x-1/2 absolute left-1/2 z-20 transform">
            <Button
              variant="secondary"
              size="icon"
              className={`transition-all duration-300 ${showScrollButton ? "opacity-100" : "pointer-events-none opacity-0"} shadow-lg hover:bg-primary hover:text-primary-foreground`}
              onClick={() => scrollToBottom()}
            >
              <ArrowDown className="size-4" />
            </Button>
          </div>
          <ChatErrorBoundary>
            <ChatInput
              chatId={chatId}
              sessionToken={session?.session.token ?? "skip"}
              disabled={status === ChatStatus.STREAMING}
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
