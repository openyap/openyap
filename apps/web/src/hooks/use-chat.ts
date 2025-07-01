import { useMutation, useQuery } from "convex/react";
import { useCallback, useEffect, useState } from "react";
import { SEARCH_TOGGLE_KEY } from "~/components/chat/chat-toggles";
import { MODEL_PERSIST_KEY } from "~/components/chat/model-selector";
import { REASONING_EFFORT_PERSIST_KEY } from "~/components/chat/reasoning-effort-selector";
import {
  type ChatMessage,
  ChatStatus,
  type MessageReasoning,
} from "~/components/chat/types";
import { usePersisted } from "~/hooks/use-persisted";
import { processDataStream } from "~/lib/ai/process-chat-response";
import { splitReasoningSteps } from "~/lib/ai/reasoning";
import { authClient } from "~/lib/auth/client";
import { api } from "~/lib/db/server";
import { isConvexId } from "~/lib/db/utils";
import {
  type EffortLabel,
  ReasoningEffort,
  getDefaultModel,
  getModelById,
} from "~/lib/models";

export function useChat(chatId: string | undefined) {
  const { data: session } = authClient.useSession();
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

  const updateAiMessage = useMutation(api.functions.message.updateAiMessage);
  const getChatMessages = useQuery(
    api.functions.chat.getChatMessages,
    isConvexId<"chat">(chatId)
      ? { chatId: chatId, sessionToken: session?.session.token }
      : "skip",
  );

  useEffect(() => {
    if (getChatMessages && status !== ChatStatus.STREAMING) {
      setMessages(getChatMessages);
    }
  }, [getChatMessages, status]);

  const append = useCallback(
    async ({ content }: { content: string }) => {
      if (!isConvexId<"chat">(chatId)) {
        return;
      }

      setStatus(ChatStatus.LOADING);

      const controller = new AbortController();
      setAbortController(controller);

      const selectedModel = getModelById(selectedModelId);

      // Get pending attachments if any
      const pendingAttachments = sessionStorage.getItem("pendingAttachments");
      console.log(
        "[useChat] Retrieved pending attachments:",
        pendingAttachments,
      );

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
            attachments: pendingAttachments
              ? JSON.parse(pendingAttachments)
              : [],
          }),
        });

        if (!response.ok || !response.body) {
          throw new Error("Failed to append message");
        }

        resetSearchToggle();

        // Clear pending attachments after successful request
        sessionStorage.removeItem("pendingAttachments");

        let contentBuffer = "";
        const reasoningBuffer: MessageReasoning = {
          text: "",
          details: [],
          duration: 0,
          reasoningEffort: reasoningEffort,
        };

        await processDataStream({
          stream: response.body,
          onTextPart(value) {
            setStatus(ChatStatus.STREAMING);
            contentBuffer += value;

            setMessages((prev) => {
              const newMessages = [...prev];
              const lastMessage = newMessages[newMessages.length - 1];
              if (lastMessage) {
                lastMessage.content = contentBuffer;
                lastMessage.status = "generating";
              }
              return newMessages;
            });
          },
          onReasoningPart(value) {
            setStatus(ChatStatus.STREAMING);
            reasoningBuffer.text += value;

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
                lastMessage.status = "reasoning";
              }
              return newMessages;
            });
          },
          onFinishMessagePart() {
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
                lastMessage.status = "finished";
              }
              return newMessages;
            });
          },
        });
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          setMessages((prev) => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            if (lastMessage) {
              lastMessage.status = "aborted";
            }
            return newMessages;
          });
        }
      } finally {
        setStatus(ChatStatus.IDLE);
        setAbortController(null);
      }
    },
    [
      chatId,
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
        status: "aborted",
        sessionToken: session?.session.token ?? "skip",
      });
      abortController.abort();
    }
  }, [abortController, messages, updateAiMessage, session?.session.token]);

  return {
    messages,
    status,
    append,
    stop,
    selectedModelId,
    setSelectedModelId,
    searchEnabled,
    setSearchEnabled,
  } as const;
}
