import { isRedirect, useNavigate } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { ArrowUpIcon } from "lucide-react";
import { memo, useCallback, useState } from "react";
import { ChatOptions } from "~/components/chat/chat-options";
import { MODEL_PERSIST_KEY } from "~/components/chat/model-selector";
import { inputStore } from "~/components/chat/stores";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { usePersisted } from "~/hooks/usePersisted";
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
    getDefaultModel().id,
  );
  const [input, setInput] = useState(inputStore.getState().input);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setInput(e.target.value);
      inputStore.getState().setInput(e.target.value);
    },
    [],
  );

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
    ],
  );

  const isDisabled = useCallback(() => {
    return disabled || !inputStore.getState().input.trim();
  }, [disabled]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        send(input);
        setInput("");
        inputStore.getState().setInput("");
      }
    },
    [input, send],
  );

  const handleSendClick = useCallback(() => {
    send(inputStore.getState().input);
    setInput("");
    inputStore.getState().setInput("");
  }, [send]);

  return (
    <div className="sticky bottom-0 z-10 bg-background pb-4">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-2 px-4">
        <div className="flex h-12 gap-2">
          <Input
            className="h-full bg-background"
            placeholder="Ask anything"
            value={input}
            onChange={handleInputChange}
            disabled={disabled}
            onKeyDown={handleKeyDown}
          />
          {disabled ? (
            <Button
              type="button"
              variant="destructive"
              onClick={onStop}
              className="flex h-full w-12 items-center justify-center"
            >
              <div className="h-4 w-4 bg-foreground" />
            </Button>
          ) : (
            <Button
              type="button"
              disabled={isDisabled()}
              onClick={handleSendClick}
              className={`${isDisabled() && "cursor-not-allowed"} h-full w-12`}
            >
              <ArrowUpIcon className="h-4 w-4" />
            </Button>
          )}
        </div>
        <ChatOptions />
      </div>
    </div>
  );
});

export { ChatInput };
