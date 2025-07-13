import { useMutation, useQuery } from "convex/react";
import { useCallback, useEffect, useState } from "react";
import { SEARCH_TOGGLE_KEY } from "~/components/chat/chat-toggles";
import { MODEL_PERSIST_KEY } from "~/components/chat/model-selector";
import { REASONING_EFFORT_PERSIST_KEY } from "~/components/chat/reasoning-effort-selector";
import {
  type ChatMessage,
  ChatStatus,
  type MessageReasoning,
  MessageStatus,
} from "~/components/chat/types";
import { usePersisted } from "~/hooks/use-persisted";
import { usePolling } from "~/hooks/use-polling";
import { processDataStream } from "~/lib/ai/process-chat-response";
import { splitReasoningSteps } from "~/lib/ai/reasoning";
import { authClient } from "~/lib/auth/client";
import { api } from "~/lib/db/server";
import { isConvexId } from "~/lib/db/utils";
import type { SerializedFile } from "~/lib/file-utils";
import { logger } from "~/lib/logger";
import {
  type EffortLabel,
  ReasoningEffort,
  getDefaultModel,
  getModelById,
} from "~/lib/models";

export function useChat(chatId: string | undefined) {
  const { data: session } = authClient.useSession();
  const sessionToken = session?.session.token;
  const { value: selectedModelId, set: setSelectedModelId } =
    usePersisted<number>(MODEL_PERSIST_KEY, getDefaultModel().id);
  const {
    value: searchEnabled,
    set: setSearchEnabled,
    reset: resetSearchToggle,
  } = usePersisted<boolean>(SEARCH_TOGGLE_KEY, false);
  const { value: reasoningEffort } = usePersisted<EffortLabel>(
    REASONING_EFFORT_PERSIST_KEY,
    ReasoningEffort.LOW,
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<ChatStatus>(ChatStatus.IDLE);
  const [abortController, setAbortController] =
    useState<AbortController | null>(null);
  const [currentChatId, setCurrentChatId] = useState<string | undefined>(
    chatId,
  );
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [pollEnabled, setPollEnabled] = useState(false);

  const updateAiMessage = useMutation(api.functions.message.updateAiMessage);
  const getChatMessages = useQuery(
    api.functions.chat.getChatMessages,
    isConvexId<"chat">(chatId) && sessionToken && (isInitialLoad || pollEnabled)
      ? { chatId: chatId, sessionToken }
      : "skip",
  );

  usePolling({
    enabled: pollEnabled,
    onPoll: () => {
      const lastMessage = messages[messages.length - 1];
      logger.debug(
        `Polling for message updates in chat ${chatId} (${messages.length} messages, last status: ${lastMessage?.status || "none"})`,
      );
    },
  });

  useEffect(() => {
    if (chatId !== currentChatId) {
      if (abortController) {
        abortController.abort();
        setAbortController(null);
      }
      setMessages([]);
      setStatus(ChatStatus.IDLE);
      setCurrentChatId(chatId);
      setIsInitialLoad(true);
      setPollEnabled(false);
    }
  }, [chatId, currentChatId, abortController]);

  const shouldEnablePolling = useCallback((messages: ChatMessage[]) => {
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
  }, []);

  useEffect(() => {
    if (!getChatMessages || chatId !== currentChatId || !sessionToken) {
      return;
    }

    setMessages(getChatMessages);

    if (isInitialLoad) {
      setIsInitialLoad(false);
      if (shouldEnablePolling(getChatMessages)) {
        setPollEnabled(true);
      }
    } else if (pollEnabled && !shouldEnablePolling(getChatMessages)) {
      setPollEnabled(false);
    }
  }, [
    getChatMessages,
    chatId,
    currentChatId,
    sessionToken,
    isInitialLoad,
    pollEnabled,
    shouldEnablePolling,
  ]);

  const append = useCallback(
    async ({
      content,
      attachments,
    }: { content: string; attachments?: SerializedFile[] }) => {
      if (!isConvexId<"chat">(chatId)) {
        return;
      }

      const controller = new AbortController();
      setAbortController(controller);

      const selectedModel = getModelById(selectedModelId);

      const attachmentCount = attachments?.length ?? 0;
      logger.info(
        `Sending message to chat ${chatId} (model: ${selectedModel?.name}, search: ${searchEnabled}, attachments: ${attachmentCount})`,
      );

      const tempUserMessage: Partial<ChatMessage> = {
        _id: `temp-user-${Date.now()}` as ChatMessage["_id"],
        _creationTime: Date.now(),
        chatId: chatId as ChatMessage["chatId"],
        role: "user",
        content,
        status: MessageStatus.COMPLETED,
        updatedAt: new Date().toISOString(),
      };

      const tempAiMessage: Partial<ChatMessage> = {
        _id: `temp-ai-${Date.now()}` as ChatMessage["_id"],
        _creationTime: Date.now() + 1,
        chatId: chatId as ChatMessage["chatId"],
        role: "assistant",
        content: "",
        status: MessageStatus.GENERATING,
        provider: selectedModel?.provider,
        model: selectedModel?.name,
        updatedAt: new Date().toISOString(),
      };

      setMessages((prev) => [
        ...prev,
        tempUserMessage as ChatMessage,
        tempAiMessage as ChatMessage,
      ]);

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          signal: controller.signal,
          body: JSON.stringify({
            chatId,
            modelId: selectedModelId,
            messages: [...messages, { role: "user", content }],
            search: searchEnabled,
            reasoningEffort:
              selectedModel && !!selectedModel.reasoningEffort
                ? reasoningEffort
                : undefined,
            attachments,
          }),
        });

        if (!response.ok || !response.body) {
          throw new Error("Failed to append message");
        }

        resetSearchToggle();

        let contentBuffer = "";
        const reasoningBuffer: MessageReasoning = {
          text: "",
          details: [],
          duration: 0,
          reasoningEffort: reasoningEffort,
        };
        let lastReasoningPart = "";

        await processDataStream({
          stream: response.body,
          onTextPart(value) {
            // Only update if we're still on the same chat
            if (chatId === currentChatId) {
              setStatus(ChatStatus.STREAMING);
              contentBuffer += value;

              setMessages((prev) => {
                const newMessages = [...prev];
                const lastMessage = newMessages[newMessages.length - 1];
                if (lastMessage) {
                  lastMessage.content = contentBuffer;
                  lastMessage.status = MessageStatus.GENERATING;
                }
                return newMessages;
              });
            }
          },
          onReasoningPart(value) {
            // Only update if we're still on the same chat
            if (chatId === currentChatId) {
              setStatus(ChatStatus.STREAMING);
              if (value !== lastReasoningPart) {
                reasoningBuffer.text += value;
                lastReasoningPart = value;
              }

              const steps = splitReasoningSteps(reasoningBuffer.text).map(
                (step) => ({ text: step }),
              );
              const completedReasoning =
                reasoningBuffer.text.length > 0
                  ? {
                      text: reasoningBuffer.text,
                      details: steps,
                      duration: reasoningBuffer.duration,
                      reasoningEffort: reasoningEffort,
                    }
                  : undefined;

              setMessages((prev) => {
                const newMessages = [...prev];
                const lastMessage = newMessages[newMessages.length - 1];
                if (lastMessage) {
                  lastMessage.content = contentBuffer;
                  lastMessage.reasoning = completedReasoning;
                  lastMessage.status = MessageStatus.REASONING;
                }
                return newMessages;
              });
            }
          },
          onFinishMessagePart() {
            // Only update if we're still on the same chat
            if (chatId === currentChatId) {
              const steps = splitReasoningSteps(reasoningBuffer.text).map(
                (step) => ({ text: step }),
              );
              const completedReasoning =
                reasoningBuffer.text.length > 0
                  ? {
                      text: reasoningBuffer.text,
                      details: steps,
                      duration: reasoningBuffer.duration,
                      reasoningEffort: reasoningEffort,
                    }
                  : undefined;

              setMessages((prev) => {
                const newMessages = [...prev];
                const lastMessage = newMessages[newMessages.length - 1];
                if (lastMessage) {
                  lastMessage.content = contentBuffer;
                  lastMessage.reasoning = completedReasoning;
                  lastMessage.status = MessageStatus.COMPLETED;
                }
                return newMessages;
              });
            }
          },
        });
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          // Only update if we're still on the same chat
          if (chatId === currentChatId) {
            setMessages((prev) => {
              const newMessages = [...prev];
              const lastMessage = newMessages[newMessages.length - 1];
              if (lastMessage) {
                lastMessage.status = MessageStatus.ABORTED;
              }
              return newMessages;
            });
          }
        }
      } finally {
        // Only update status if we're still on the same chat
        if (chatId === currentChatId) {
          setStatus(ChatStatus.IDLE);
        }
        setAbortController(null);
      }
    },
    [
      chatId,
      currentChatId,
      selectedModelId,
      messages,
      searchEnabled,
      resetSearchToggle,
      reasoningEffort,
    ],
  );

  const stop = useCallback(() => {
    if (abortController) {
      updateAiMessage({
        messageId: messages[messages.length - 1]._id,
        status: MessageStatus.ABORTED,
        sessionToken: sessionToken ?? "skip",
      });
      abortController.abort();
    }
  }, [abortController, messages, updateAiMessage, sessionToken]);

  return {
    messages,
    isLoadingMessages: !getChatMessages || !sessionToken,
    status,
    append,
    stop,
    selectedModelId,
    setSelectedModelId,
    searchEnabled,
    setSearchEnabled,
  } as const;
}
