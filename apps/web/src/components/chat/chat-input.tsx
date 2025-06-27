import { isRedirect, useNavigate } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { ArrowUpIcon, Square } from "lucide-react";
import { memo, useCallback, useState } from "react";
import { ChatOptions } from "~/components/chat/chat-options";
import { MODEL_PERSIST_KEY } from "~/components/chat/model-selector";
import { inputStore } from "~/components/chat/stores";
import { Button } from "~/components/ui/button";
import {
  PromptInput,
  PromptInputAction,
  PromptInputActions,
  PromptInputTextarea,
} from "~/components/ui/prompt-input";
import { usePersisted } from "~/hooks/use-persisted";
import { api } from "~/lib/db/server";
import { getDefaultModel, getModelById } from "~/lib/models";

interface ChatInputProps {
  chatId?: string;
  sessionToken: string;
  disabled: boolean;
  addUserMessage: (message: string) => void;
  onStop: () => void;
}

const ChatInput = memo(function ChatInput({
  chatId,
  sessionToken,
  disabled,
  addUserMessage,
  onStop,
}: ChatInputProps) {
  const navigate = useNavigate();
  const createChat = useMutation(api.functions.chat.createChat);
  const { value: selectedModelId } = usePersisted<number>(
    MODEL_PERSIST_KEY,
    getDefaultModel().id
  );
  const [input, setInput] = useState(inputStore.getState().input);

  const send = useCallback(
    async (input: string) => {
      const text = input.trim();
      if (!text) return;

      if (!chatId) {
        try {
          localStorage.setItem("firstMessage", text);

          const model = getModelById(selectedModelId);

          const newChatId = await createChat({
            sessionToken,
            title: "New Chat",
            visibility: "private",
            provider: model?.provider,
            model: model?.modelId,
          });

          console.log("[ChatView] New Chat ID: ", newChatId);

          await navigate({
            to: "/chat/$chatId",
            replace: true,
            params: { chatId: newChatId },
          });
        } catch (err) {
          if (!isRedirect(err)) throw err;
        }
        return;
      }

      addUserMessage(text);
    },
    [
      chatId,
      sessionToken,
      createChat,
      navigate,
      addUserMessage,
      selectedModelId,
    ]
  );

  const handleSubmit = useCallback(() => {
    const currentInput = inputStore.getState().input;
    send(currentInput);
    setInput("");
    inputStore.getState().setInput("");
  }, [send]);

  const isDisabled = useCallback(() => {
    return disabled || !inputStore.getState().input.trim();
  }, [disabled]);

  return (
    <div className="sticky bottom-0 z-10 bg-background pb-4">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-2 px-4">
        <PromptInput
          value={input}
          onValueChange={(val) => {
            setInput(val);
            inputStore.getState().setInput(val);
          }}
          isLoading={disabled}
          onSubmit={handleSubmit}
          className="w-full"
        >
          <PromptInputTextarea placeholder="Ask anything" />

          <PromptInputActions className="flex items-center justify-between pt-2">
            <ChatOptions />

            <PromptInputAction
              tooltip={disabled ? "Stop generation" : "Send message"}
              side="top"
            >
              {disabled ? (
                <Button
                  variant="default"
                  size="icon"
                  className="h-8 w-8"
                  onClick={onStop}
                >
                  <Square className="h-4 w-4 fill-background" />
                </Button>
              ) : (
                <Button
                  variant="default"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  onClick={handleSubmit}
                  disabled={isDisabled()}
                >
                  <ArrowUpIcon className="h-4 w-4" />
                </Button>
              )}
            </PromptInputAction>
          </PromptInputActions>
        </PromptInput>
      </div>
    </div>
  );
});

export { ChatInput };
