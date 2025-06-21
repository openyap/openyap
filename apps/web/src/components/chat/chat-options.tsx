import { memo } from "react";
import {
  ModelSelector,
  type ModelSelectorProps,
} from "~/components/chat/model-selector";
import { ChatToggles } from "~/components/chat/chat-toggles";

interface ChatOptionsProps extends ModelSelectorProps {}

const ChatOptions = memo(function ChatOptions({
  selectedModelId,
  onModelChange,
}: ChatOptionsProps) {
  return (
    <div className="flex gap-2 items-center">
      <ModelSelector
        selectedModelId={selectedModelId}
        onModelChange={onModelChange}
      />
      <ChatToggles />
    </div>
  );
});

export { ChatOptions, type ChatOptionsProps };
