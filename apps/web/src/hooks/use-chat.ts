import { useMutation, useQuery } from "convex/react";
import { useCallback, useEffect, useState } from "react";
import { SEARCH_TOGGLE_KEY } from "~/components/chat/chat-toggles";
import { MODEL_PERSIST_KEY } from "~/components/chat/model-selector";
import { REASONING_EFFORT_PERSIST_KEY } from "~/components/chat/reasoning-effort-selector";
import type {
  ChatMessage,
  MessageReasoning,
  StreamingMessage,
} from "~/components/chat/types";
import { usePersisted } from "~/hooks/use-persisted";
import { processDataStream } from "~/lib/ai/process-chat-response";
import { splitReasoningSteps } from "~/lib/ai/reasoning";
import { authClient } from "~/lib/auth/client";
import { api } from "~/lib/db/server";
import { isConvexId } from "~/lib/db/utils";
import {
  getDefaultModel,
  type EffortLabel,
  ReasoningEffort,
  getModelById,
} from "~/lib/models";

type ChatStatus = "streaming" | "idle";
type Role = "user" | "data" | "system" | "assistant";

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
    ReasoningEffort.LOW
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streamingMessage, setStreamingMessage] =
    useState<StreamingMessage | null>(null);
  const [status, setStatus] = useState<ChatStatus>("idle");
  const [abortController, setAbortController] =
    useState<AbortController | null>(null);

  const updateUserMessage = useMutation(
    api.functions.message.updateUserMessage
  );
  const updateAiMessage = useMutation(api.functions.message.updateAiMessage);
  const getChatMessages = useQuery(
    api.functions.chat.getChatMessages,
    isConvexId<"chat">(chatId)
      ? { chatId: chatId, sessionToken: session?.session.token }
      : "skip"
  );

  useEffect(() => {
    if (getChatMessages) {
      setMessages(getChatMessages);
    }
  }, [getChatMessages]);

  const append = useCallback(
    async ({ role, content }: { role: Role; content: string }) => {
      if (!isConvexId<"chat">(chatId)) {
        return;
      }
      setStatus("streaming");
      setStreamingMessage({
        chatId,
        role,
        content,
        status: "streaming",
      });
      const controller = new AbortController();
      setAbortController(controller);

      const selectedModel = getModelById(selectedModelId);

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          signal: controller.signal,
          body: JSON.stringify({
            chatId,
            modelId: selectedModelId,
            messages: [...messages, { role, content }],
            search: searchEnabled,
            reasoningEffort:
              selectedModel && !!selectedModel.reasoningEffort
                ? reasoningEffort
                : undefined,
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

        await processDataStream({
          stream: response.body,
          onTextPart(value) {
            contentBuffer += value;

            setStreamingMessage((prev) => {
              if (!prev) return null;
              return {
                ...prev,
                chatId,
                role: "assistant",
                content: contentBuffer,
                status: "generating",
              };
            });
          },
          onReasoningPart(value) {
            reasoningBuffer.text += value;

            const steps = splitReasoningSteps(reasoningBuffer.text).map(
              (step) => ({ text: step })
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
            setStreamingMessage((prev) => {
              if (!prev) return null;
              return {
                ...prev,
                chatId,
                role: "assistant",
                content: contentBuffer,
                reasoning: completedReasoning,
                status: "reasoning",
              };
            });
          },
          onFinishMessagePart() {
            const steps = splitReasoningSteps(reasoningBuffer.text).map(
              (step) => ({ text: step })
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
            setStreamingMessage({
              chatId,
              role: "assistant",
              content: contentBuffer,
              reasoning: completedReasoning,
              status: "finished",
            });
          },
        });
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          setStreamingMessage((prev) =>
            prev ? { ...prev, status: "aborted" } : null
          );
        } else {
          updateUserMessage({
            messageId: messages[messages.length - 1]._id,
            error: "Failed to generate message",
            sessionToken: session?.session.token ?? "skip",
          });
        }
      } finally {
        setStatus("idle");
        setAbortController(null);
      }
    },
    [
      chatId,
      selectedModelId,
      messages,
      searchEnabled,
      updateUserMessage,
      resetSearchToggle,
      session?.session.token,
      reasoningEffort,
    ]
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
    streamingMessage,
    status,
    append,
    stop,
    selectedModelId,
    setSelectedModelId,
    searchEnabled,
    setSearchEnabled,
  } as const;
}
