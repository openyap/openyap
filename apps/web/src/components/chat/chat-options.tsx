import { memo } from "react";
import { ChatToggles } from "~/components/chat/chat-toggles";
import { FileAttachmentButton } from "~/components/chat/file-attachment-button";
import {
	MODEL_PERSIST_KEY,
	ModelSelector,
} from "~/components/chat/model-selector";
import { ReasoningEffortSelector } from "~/components/chat/reasoning-effort-selector";
import type { AttachedFile } from "~/components/chat/stores";
import { usePersisted } from "~/hooks/use-persisted";
import { getDefaultModel, getModelById } from "~/lib/models";

interface ChatOptionsProps {
	attachedFiles?: AttachedFile[];
	onFilesSelected: (files: File[]) => void;
}

const ChatOptions = memo(function ChatOptions({
	attachedFiles,
	onFilesSelected,
}: ChatOptionsProps) {
	const { value: selectedModelId } = usePersisted<number>(
		MODEL_PERSIST_KEY,
		getDefaultModel().id,
	);

	const currentModel = getModelById(selectedModelId);

	return (
		<div className="flex items-center gap-2">
			<FileAttachmentButton
				attachedFiles={attachedFiles}
				onFilesSelected={onFilesSelected}
				currentModel={currentModel}
			/>
			<ModelSelector />
			<ReasoningEffortSelector />
			<ChatToggles />
		</div>
	);
});

export { ChatOptions };
export type { ChatOptionsProps };
