import { memo } from "react";
import { ChatToggles } from "~/components/chat/chat-toggles";
import { FileAttachmentButton } from "~/components/chat/file-attachment-button";
import { ModelSelector } from "~/components/chat/model-selector";
import { ReasoningEffortSelector } from "~/components/chat/reasoning-effort-selector";
import type { AttachedFile } from "~/components/chat/stores";

interface ChatOptionsProps {
  attachedFiles?: AttachedFile[];
  onFilesSelected: (files: File[]) => void;
}

const ChatOptions = memo(function ChatOptions({
  attachedFiles,
  onFilesSelected,
}: ChatOptionsProps) {
  return (
    <div className="flex items-center gap-2">
      <FileAttachmentButton
        attachedFiles={attachedFiles}
        onFilesSelected={onFilesSelected}
      />
      <ModelSelector />
      <ReasoningEffortSelector />
      <ChatToggles />
    </div>
  );
});

export { ChatOptions };
export type { ChatOptionsProps };
