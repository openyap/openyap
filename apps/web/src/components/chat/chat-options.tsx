import { memo } from "react";
import { ChatToggles } from "~/components/chat/chat-toggles";
import { ModelSelector } from "~/components/chat/model-selector";
import { ReasoningEffortSelector } from "~/components/chat/reasoning-effort-selector";

const ChatOptions = memo(function ChatOptions() {
  return (
    <div className="flex items-center gap-2">
      <ModelSelector />
      <ReasoningEffortSelector />
      <ChatToggles />
    </div>
  );
});

export { ChatOptions };
