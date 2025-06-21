import { memo } from "react";
import { ChatToggles } from "~/components/chat/chat-toggles";
import { ModelSelector } from "~/components/chat/model-selector";

const ChatOptions = memo(function ChatOptions() {
  return (
    <div className="flex items-center gap-2">
      <ModelSelector />
      <ChatToggles />
    </div>
  );
});

export { ChatOptions };
