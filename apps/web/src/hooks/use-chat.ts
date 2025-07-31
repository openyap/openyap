import { useMutation, useQuery } from "convex/react";
import { useCallback, useEffect } from "react";
import {
  type ChatMessage,
  ChatStatus,
  type MessageReasoning,
  MessageStatus,
} from "~/components/chat/types";
import { useChatSettings } from "~/hooks/use-chat-settings";
import { useChatStore, useChatStoreSubscription } from "~/hooks/use-chat-store";
import {
  createTempMessages,
  shouldEnablePolling,
} from "~/hooks/use-chat-utils";
import { usePolling } from "~/hooks/use-polling";
import { processDataStream } from "~/lib/ai/process-chat-response";
import { splitReasoningSteps } from "~/lib/ai/reasoning";
import { authClient } from "~/lib/auth/client";
import { api } from "~/lib/db/server";
import { isConvexId } from "~/lib/db/utils";
import type { SerializedFile } from "~/lib/file-utils";
import { logger } from "~/lib/logger";
import { getModelById } from "~/lib/models";

export function useChat(chatId: string | undefined) {
  const { data: session } = authClient.useSession();
  const sessionToken = session?.session.token;

  const settings = useChatSettings();
  const store = useChatStore(chatId);

  const messages = useChatStoreSubscription(chatId, (state) => state.messages);
  const status = useChatStoreSubscription(chatId, (state) => state.status);
  const abortController = useChatStoreSubscription(
    chatId,
    (state) => state.abortController,
  );
  const currentChatId = useChatStoreSubscription(
    chatId,
    (state) => state.currentChatId,
  );
  const isInitialLoad = useChatStoreSubscription(
    chatId,
    (state) => state.isInitialLoad,
  );
  const pollEnabled = useChatStoreSubscription(
    chatId,
    (state) => state.pollEnabled,
  );

  const updateAiMessage = useMutation(api.functions.message.updateAiMessage);
  const getChatMessages = useQuery(
    api.functions.chat.getChatMessages,
    isConvexId<"chat">(chatId) && sessionToken
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
      store.resetChat(chatId);
    }
  }, [chatId, currentChatId, store.resetChat]);

  useEffect(() => {
    if (!getChatMessages || chatId !== currentChatId || !sessionToken) {
      return;
    }

    store.setMessages(getChatMessages);

    if (isInitialLoad) {
      store.setInitialLoad(false);
      if (shouldEnablePolling(getChatMessages)) {
        store.setPollEnabled(true);
      }
    } else if (pollEnabled && !shouldEnablePolling(getChatMessages)) {
      store.setPollEnabled(false);
    }
  }, [
    getChatMessages,
    chatId,
    currentChatId,
    sessionToken,
    isInitialLoad,
    pollEnabled,
    store.setMessages,
    store.setInitialLoad,
    store.setPollEnabled,
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
      store.setAbortController(controller);

      const selectedModel = getModelById(settings.selectedModelId);
      const [tempUserMessage, tempAiMessage] = createTempMessages(
        chatId,
        content,
        selectedModel || null,
      );

      const attachmentCount = attachments?.length ?? 0;
      logger.info(
        `Sending message to chat ${chatId} (model: ${selectedModel?.name}, search: ${settings.searchEnabled}, attachments: ${attachmentCount})`,
      );

      store.addMessages([
        tempUserMessage as ChatMessage,
        tempAiMessage as ChatMessage,
      ]);

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          signal: controller.signal,
          body: JSON.stringify({
            chatId,
            modelId: settings.selectedModelId,
            messages: [...messages, { role: "user", content }],
            search: settings.searchEnabled,
            reasoningEffort:
              selectedModel && !!selectedModel.reasoningEffort
                ? settings.reasoningEffort
                : undefined,
            attachments,
          }),
        });

        if (!response.ok || !response.body) {
          throw new Error("Failed to append message");
        }

        settings.resetSearchToggle();

        let contentBuffer = "";
        const reasoningBuffer: MessageReasoning = {
          text: "",
          details: [],
          duration: 0,
          reasoningEffort: settings.reasoningEffort,
        };
        let lastReasoningPart = "";

        await processDataStream({
          stream: response.body,
          onTextPart(value) {
            if (chatId === currentChatId) {
              store.setStatus(ChatStatus.STREAMING);
              contentBuffer += value;
              store.updateLastMessage({
                content: contentBuffer,
                status: MessageStatus.GENERATING,
              });
            }
          },
          onReasoningPart(value) {
            if (chatId === currentChatId) {
              store.setStatus(ChatStatus.STREAMING);
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
                      reasoningEffort: settings.reasoningEffort,
                    }
                  : undefined;

              store.updateLastMessage({
                content: contentBuffer,
                reasoning: completedReasoning,
                status: MessageStatus.REASONING,
              });
            }
          },
          onFinishMessagePart() {
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
                      reasoningEffort: settings.reasoningEffort,
                    }
                  : undefined;

              store.updateLastMessage({
                content: contentBuffer,
                reasoning: completedReasoning,
                status: MessageStatus.COMPLETED,
              });
            }
          },
        });
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          if (chatId === currentChatId) {
            store.updateLastMessage({ status: MessageStatus.ABORTED });
          }
        }
      } finally {
        if (chatId === currentChatId) {
          store.setStatus(ChatStatus.IDLE);
        }
        store.setAbortController(null);
      }
    },
    [
      chatId,
      currentChatId,
      messages,
      settings.selectedModelId,
      settings.searchEnabled,
      settings.resetSearchToggle,
      settings.reasoningEffort,
      store.addMessages,
      store.setStatus,
      store.setAbortController,
      store.updateLastMessage,
    ],
  );

  const regenerate = useCallback(
    async (upToMessageId: string, editedContent?: string) => {
      if (!isConvexId<"chat">(chatId) || !sessionToken) {
        return;
      }

      // Find the index of the message we're regenerating from
      const messageIndex = messages.findIndex((m) => m._id === upToMessageId);
      if (messageIndex === -1) return;

      // Get all messages up to and including the edited message
      // If editedContent is provided, update the last user message with it
      const messagesForRegeneration = messages
        .slice(0, messageIndex + 1)
        .map((msg, idx) => {
          if (
            idx === messageIndex &&
            editedContent !== undefined &&
            msg.role === "user"
          ) {
            return { ...msg, content: editedContent };
          }
          return msg;
        });

      const controller = new AbortController();
      store.setAbortController(controller);

      const selectedModel = getModelById(settings.selectedModelId);
      const tempAiMessage = createTempMessages(
        chatId,
        "",
        selectedModel || null,
      )[1];

      logger.info(
        `Regenerating AI response after message edit in chat ${chatId} (model: ${selectedModel?.name})`,
      );

      // Enable polling to ensure we get the latest messages
      store.setPollEnabled(true);

      // Only add the AI message to the store
      store.addMessages([tempAiMessage as ChatMessage]);

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          signal: controller.signal,
          body: JSON.stringify({
            chatId,
            modelId: settings.selectedModelId,
            messages: messagesForRegeneration.map((m) => ({
              role: m.role,
              content: m.content,
            })),
            search: settings.searchEnabled,
            reasoningEffort:
              selectedModel && !!selectedModel.reasoningEffort
                ? settings.reasoningEffort
                : undefined,
            isRegeneration: true, // Flag to prevent creating a new user message
          }),
        });

        if (!response.ok || !response.body) {
          throw new Error("Failed to regenerate response");
        }

        settings.resetSearchToggle();

        let contentBuffer = "";
        const reasoningBuffer: MessageReasoning = {
          text: "",
          details: [],
          duration: 0,
          reasoningEffort: settings.reasoningEffort,
        };
        let lastReasoningPart = "";

        await processDataStream({
          stream: response.body,
          onTextPart(value) {
            if (chatId === currentChatId) {
              store.setStatus(ChatStatus.STREAMING);
              contentBuffer += value;
              store.updateLastMessage({
                content: contentBuffer,
                status: MessageStatus.GENERATING,
              });
            }
          },
          onReasoningPart(value) {
            if (chatId === currentChatId) {
              store.setStatus(ChatStatus.STREAMING);
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
                      reasoningEffort: settings.reasoningEffort,
                    }
                  : undefined;

              store.updateLastMessage({
                content: contentBuffer,
                reasoning: completedReasoning,
                status: MessageStatus.REASONING,
              });
            }
          },
          onFinishMessagePart() {
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
                      reasoningEffort: settings.reasoningEffort,
                    }
                  : undefined;

              store.updateLastMessage({
                content: contentBuffer,
                reasoning: completedReasoning,
                status: MessageStatus.COMPLETED,
              });
            }
          },
        });
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          if (chatId === currentChatId) {
            store.updateLastMessage({ status: MessageStatus.ABORTED });
          }
        }
      } finally {
        if (chatId === currentChatId) {
          store.setStatus(ChatStatus.IDLE);
        }
        store.setAbortController(null);
      }
    },
    [
      chatId,
      currentChatId,
      messages,
      sessionToken,
      settings.selectedModelId,
      settings.searchEnabled,
      settings.resetSearchToggle,
      settings.reasoningEffort,
      store.addMessages,
      store.setStatus,
      store.setAbortController,
      store.updateLastMessage,
      store.setPollEnabled,
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
    regenerate,
    stop,
    selectedModelId: settings.selectedModelId,
    setSelectedModelId: settings.setSelectedModelId,
    searchEnabled: settings.searchEnabled,
    setSearchEnabled: settings.setSearchEnabled,
  } as const;
}
