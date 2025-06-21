import { isRedirect, useNavigate } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { useState, memo, useCallback } from "react";
import { api } from "~/lib/db/server";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { ArrowUpIcon } from "lucide-react";
import { inputStore } from "~/components/chat/stores";
import { ChatOptions } from "~/components/chat/chat-options";

interface ChatInputProps {
  chatId?: string;
  sessionToken: string;
  disabled: boolean;
  selectedModelId: number;
  onModelChange: (modelId: number) => void;
  addUserMessage: (message: string) => void;
}

const ChatInput = memo(function ChatInput({
  chatId,
  sessionToken,
  disabled,
  selectedModelId,
  onModelChange,
  addUserMessage,
}: ChatInputProps) {
  const navigate = useNavigate();
  const createChat = useMutation(api.functions.chat.createChat);
  const [input, setInput] = useState(inputStore.getState().input);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setInput(e.target.value);
      inputStore.getState().setInput(e.target.value);
    },
    []
  );

  const send = useCallback(
    async (input: string) => {
      const text = input.trim();
      if (!text) return;

      if (!chatId) {
        try {
          localStorage.setItem("firstMessage", text);

          const newChatId = await createChat({
            sessionToken,
            title: "New Chat",
            visibility: "private",
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
    [chatId, sessionToken, createChat, navigate, addUserMessage]
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
    [input, send]
  );

  const handleSendClick = useCallback(() => {
    send(inputStore.getState().input);
    setInput("");
    inputStore.getState().setInput("");
  }, [send]);

  return (
    <div className="sticky bottom-0 pb-4 z-10 bg-background">
      <div className="flex flex-col gap-2 max-w-5xl mx-auto w-full px-4">
        <div className="flex gap-2 h-12">
          <Input
            className="bg-background h-full"
            placeholder="Ask anything"
            value={input}
            onChange={handleInputChange}
            disabled={disabled}
            onKeyDown={handleKeyDown}
          />
          <Button
            type="button"
            disabled={isDisabled()}
            onClick={handleSendClick}
            className={`${isDisabled() && "cursor-not-allowed"} h-full w-12`}
          >
            {disabled ? (
              <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <ArrowUpIcon className="w-4 h-4" />
            )}
          </Button>
        </div>
        <ChatOptions
          selectedModelId={selectedModelId}
          onModelChange={onModelChange}
        />
      </div>
    </div>
  );
});

export { ChatInput };
