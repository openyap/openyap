import { useParams } from "@tanstack/react-router";
import { ArrowDown } from "lucide-react";
import { AnimatePresence } from "motion/react";
import { useEffect } from "react";
import { ChatInput } from "~/components/chat/chat-input";
import { MemoizedMessage, Message } from "~/components/chat/message";
import { ChatStatus, MessageStatus } from "~/components/chat/types";
import {
	ChatErrorBoundary,
	MessageErrorBoundary,
} from "~/components/error-boundary";
import { Button } from "~/components/ui/button";
import { useChat } from "~/hooks/use-chat";
import { useChatScroll } from "~/hooks/use-chat-scroll";
import { useChatsList } from "~/hooks/use-chats-list";
import { useFirstMessage } from "~/hooks/use-first-message";
import { authClient } from "~/lib/auth/client";
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

	const isEmpty = !chatId || (messages.length === 0 && !isLoadingMessages);

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
