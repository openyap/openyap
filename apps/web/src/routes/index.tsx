import { useChat } from "@ai-sdk/react";

// TODO: fix this poop

const PlusSVG = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 18 18"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-label="Plus icon"
  >
    <title>Plus icon</title>
    <line
      x1="9"
      y1="0"
      x2="9"
      y2="18"
      stroke="#374151"
      strokeWidth="2"
      strokeLinecap="butt"
    />
    <line
      x1="0"
      y1="9"
      x2="18"
      y2="9"
      stroke="#374151"
      strokeWidth="2"
      strokeLinecap="butt"
    />
  </svg>
);

export const Route = createFileRoute({
  component: Index,
});

function Index() {
  const { messages, input, handleInputChange, handleSubmit } = useChat({
    api: "/api/chat",
  });

  return (
    <div className="mx-auto h-full w-full overscroll-none md:w-1/2">
      <div className="mx-auto flex w-[94%] flex-col gap-y-4 pt-4 pb-36 items-center justify-center">
        <div className="w-full max-w-md space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`whitespace-pre-wrap p-4 border-2 border-dotted border-gray-700 bg-white ${
                message.role === "user"
                  ? "ml-auto max-w-[80%]"
                  : "mr-auto max-w-[80%]"
              }`}
            >
              {message.parts.map((part, i) => {
                switch (part.type) {
                  case "text":
                    return (
                      <div key={`${message.id}-${i}`} className="text-gray-900">
                        {part.text}
                      </div>
                    );
                  default:
                    return null;
                }
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="group fixed bottom-0 w-full md:w-1/2 px-2">
        <form onSubmit={handleSubmit}>
          <div className="relative w-full max-w-md mx-auto border-t-2 border-x-2 border-dotted border-gray-700 bg-white">
            <span className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 select-none">
              <PlusSVG />
            </span>
            <span className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 select-none">
              <PlusSVG />
            </span>
            <input
              type="text"
              value={input}
              onChange={handleInputChange}
              placeholder="Type your message..."
              className="w-full bg-transparent outline-none px-4 py-3 text-gray-900 placeholder-gray-400 rounded-lg"
              aria-label="Chat message input"
            />
          </div>
        </form>
      </div>
    </div>
  );
}
