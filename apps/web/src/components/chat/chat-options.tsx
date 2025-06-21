import { memo } from "react";
import { ModelSelector } from "~/components/chat/model-selector";
import { ChatToggles } from "~/components/chat/chat-toggles";

const ChatOptions = memo(function ChatOptions() {
  return (
    <div className="flex gap-2 items-center">
      <ModelSelector />
      <ChatToggles />
    </div>
  );
});

export { ChatOptions };
