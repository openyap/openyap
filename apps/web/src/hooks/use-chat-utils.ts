import { type ChatMessage, MessageStatus } from "~/components/chat/types";

export const shouldEnablePolling = (messages: ChatMessage[]): boolean => {
  const lastMessage = messages[messages.length - 1];
  return (
    (lastMessage &&
      [
        MessageStatus.GENERATING,
        MessageStatus.REASONING,
        MessageStatus.STREAMING,
      ].includes(lastMessage.status as MessageStatus)) ||
    messages.length < 2
  );
};

export const createTempMessages = (
  chatId: string,
  content: string,
  selectedModel: { provider?: string; name?: string } | null,
): [Partial<ChatMessage>, Partial<ChatMessage>] => {
  const now = Date.now();

  const tempUserMessage: Partial<ChatMessage> = {
    _id: `temp-user-${now}` as ChatMessage["_id"],
    _creationTime: now,
    chatId: chatId as ChatMessage["chatId"],
    role: "user",
    content,
    status: MessageStatus.COMPLETED,
    updatedAt: new Date().toISOString(),
  };

  const tempAiMessage: Partial<ChatMessage> = {
    _id: `temp-ai-${now + 1}` as ChatMessage["_id"],
    _creationTime: now + 1,
    chatId: chatId as ChatMessage["chatId"],
    role: "assistant",
    content: "",
    status: MessageStatus.GENERATING,
    provider: selectedModel?.provider,
    model: selectedModel?.name,
    updatedAt: new Date().toISOString(),
  };

  return [tempUserMessage, tempAiMessage];
};
