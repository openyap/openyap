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

  const { input, handleInputChange, append, messages, status, setInput } =
    useChat({
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
    setInput("");
  }

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>Start a conversation...</p>
          </div>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${
                m.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[70%] rounded-lg px-4 py-2 ${
                  m.role === "user"
                    ? "bg-blue-500 text-white ml-auto"
                    : "bg-gray-100 text-gray-900 mr-auto"
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{m.content}</p>
              </div>
            </div>
          ))
        )}
        {status === "streaming" && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-900 rounded-lg px-4 py-2 max-w-[70%]">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 p-4 bg-white">
        <div className="flex items-center space-x-2 max-w-4xl mx-auto">
          <input
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder="Type your message..."
            value={input}
            onChange={handleInputChange}
            disabled={status === "submitted" || status === "streaming"}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
          />
          <button
            type="button"
            disabled={
              status === "submitted" || status === "streaming" || !input.trim()
            }
            onClick={send}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              status === "submitted" || status === "streaming" || !input.trim()
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-blue-500 text-white hover:bg-blue-600"
            }`}
          >
            {status === "submitted" || status === "streaming" ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              "Send"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
