import { useNavigate, useParams } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { isRedirect } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { authClient } from "~/lib/auth/client";
import { api } from "~/lib/db/server";
import { useEffect, useState } from "react";
import type { Id } from "convex/_generated/dataModel";
import { ArrowUpIcon } from "lucide-react";
import { Message } from "~/components/message";
import { Input } from "./ui/input";
import { Button } from "./ui/button";

interface ChatInputProps {
  chatId?: string;
  sessionToken: string;
  disabled: boolean;
  addUserMessage: (message: string) => void;
}

function ChatInput({
  chatId,
  sessionToken,
  disabled,
  addUserMessage,
}: ChatInputProps) {
  const navigate = useNavigate();
  const createChat = useMutation(api.functions.chat.createChat);
  const [input, setInput] = useState("");

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setInput(e.target.value);
  }

  async function send() {
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
    setInput("");
  }

  return (
    <div className="sticky bottom-0 pb-4 z-10 bg-background">
      <div className="flex gap-2 max-w-5xl mx-auto w-full h-10 px-4">
        <Input
          className="bg-background h-full"
          placeholder="Ask anything"
          value={input}
          onChange={handleInputChange}
          disabled={disabled}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
        />
        <Button
          type="button"
          disabled={disabled || !input.trim()}
          onClick={send}
          className={`${disabled || (!input.trim() && "cursor-not-allowed")} h-full w-10`}
        >
          {disabled ? (
            <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
          ) : (
            <ArrowUpIcon className="w-4 h-4" />
          )}
        </Button>
      </div>
    </div>
  );
}

export function ChatView() {
  const { data: session } = authClient.useSession();
  const params = useParams({ strict: false }) as { chatId?: string };
  const chatId = params?.chatId;

  const updateChat = useMutation(api.functions.chat.updateChat);
  const getChatMessages = useQuery(
    api.functions.chat.getChatMessages,
    chatId && session
      ? { chatId: chatId as Id<"chat">, sessionToken: session.session.token }
      : "skip"
  );

  const { messages, status, append } = useChat({
    id: chatId ?? "skip",
    body: { chatId },
    initialMessages: (getChatMessages ?? []).map((m) => ({
      ...m,
      id: m._id,
      role: m.role as "user" | "data" | "system" | "assistant",
    })),
  });

  useEffect(() => {
    async function sendFirstMessage() {
      const firstMessage = localStorage.getItem("firstMessage");
      if (chatId && firstMessage) {
        localStorage.removeItem("firstMessage");
        await append({ role: "user", content: firstMessage });

        const response = await fetch("/api/generateChatTitle", {
          method: "POST",
          body: JSON.stringify({ message: firstMessage }),
        });
        const { title } = await response.json();
        await updateChat({
          chatId: chatId as Id<"chat">,
          title,
          sessionToken: session?.session.token ?? "skip",
        });
      }
    }
    sendFirstMessage();
  }, [chatId, append, session?.session.token, updateChat]);

  function addUserMessage(message: string) {
    append({ role: "user", content: message });
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4 h-full">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center text-foreground h-full">
              <h1 className="text-2xl">Where should we begin?</h1>
            </div>
          ) : (
            messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${
                  m.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {m.role === "user" ? (
                  <div className="max-w-[70%] rounded-lg px-4 py-2 border bg-sidebar-accent text-sidebar-accent-foreground border-border ml-auto">
                    <Message content={m.content} />
                  </div>
                ) : (
                  <div className="text-foreground max-w-[70%]">
                    <Message content={m.content} />
                  </div>
                )}
              </div>
            ))
          )}
          {status === "streaming" && (
            <div className="flex justify-start">
              <div className="bg-card text-card-foreground rounded-lg px-4 py-2 max-w-[70%] border border-border">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-foreground rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-foreground rounded-full animate-bounce delay-100" />
                  <div className="w-2 h-2 bg-foreground rounded-full animate-bounce delay-200" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <ChatInput
        chatId={chatId}
        sessionToken={session?.session.token ?? "skip"}
        disabled={status === "streaming"}
        addUserMessage={addUserMessage}
      />
    </div>
  );
}
