import { useNavigate, useParams, useSearch } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { isRedirect } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { authClient } from "~/lib/auth/client";
import { api } from "../../convex/_generated/api";
import { useMessageStore } from "~/stores/message-store";
import { useEffect } from "react";

export function ChatView() {
  const { data: session } = authClient.useSession();
  const createChat = useMutation(api.functions.chat.createChat);
  const {
    firstMessage,
    hasBeenSent,
    setFirstMessage,
    markAsSent,
    clearFirstMessage,
  } = useMessageStore();
  const navigate = useNavigate();

  const params = useParams({ strict: false }) as { chatId?: string };
  const chatId = params?.chatId;

  const { input, handleInputChange, append, messages, status } = useChat({
    id: chatId ?? "skip",
    body: { chatId },
  });

  useEffect(() => {
    if (chatId && firstMessage && !hasBeenSent) {
      append({ role: "user", content: firstMessage });
      clearFirstMessage();
      markAsSent();
    }
  }, [
    chatId,
    firstMessage,
    hasBeenSent,
    append,
    markAsSent,
    clearFirstMessage,
  ]);

  async function send() {
    const text = input.trim();
    if (!text) return;

    if (!chatId) {
      try {
        setFirstMessage(text);

        const newChatId = await createChat({
          sessionToken: session?.session.token ?? "skip",
          title: "New Chat",
          visibility: "private",
        });

        console.log("[ChatView] New Chat ID: ", newChatId);

        navigate({
          to: "/chat/$chatId",
          replace: true,
          params: { chatId: newChatId },
        });
      } catch (err) {
        if (!isRedirect(err)) throw err;
      }
      return;
    }

    await append({ role: "user", content: text });
  }

  return (
    <>
      {messages.map((m) => (
        <div key={m.id}>
          {m.role}: {m.content}
        </div>
      ))}

      <input
        className="bg-black text-white"
        value={input}
        onChange={handleInputChange}
      />
      <button
        disabled={status === "submitted" || status === "streaming"}
        onClick={send}
      >
        Send
      </button>
    </>
  );
}
