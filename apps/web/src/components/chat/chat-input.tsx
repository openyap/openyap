import { isRedirect, useNavigate } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { useState, memo, useCallback } from "react";
import { api } from "~/lib/db/server";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { ArrowUpIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { models } from "~/lib/models";
import { inputStore } from "~/components/chat/stores";

interface ModelSelectorProps {
  selectedModelId: number;
  onModelChange: (modelId: number) => void;
}

const ModelSelector = memo(function ModelSelector({
  selectedModelId,
  onModelChange,
}: ModelSelectorProps) {
  const handleModelChange = useCallback(
    (value: string) => {
      onModelChange(Number.parseInt(value));
    },
    [onModelChange]
  );

  return (
    <div className="flex justify-start">
      <Select
        value={selectedModelId.toString()}
        onValueChange={handleModelChange}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Select model" />
        </SelectTrigger>
        <SelectContent>
          {models.map((model) => (
            <SelectItem key={model.id} value={model.id.toString()}>
              {model.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
});

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
        <ModelSelector
          selectedModelId={selectedModelId}
          onModelChange={onModelChange}
        />
      </div>
    </div>
  );
});

export { ChatInput };
