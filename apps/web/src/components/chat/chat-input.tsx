import { isRedirect, useNavigate } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { ArrowUpIcon, Paperclip, Square } from "lucide-react";
import { memo, useCallback, useEffect, useState } from "react";
import { ChatOptions } from "~/components/chat/chat-options";
import { FilePills } from "~/components/chat/file-pills";
import { MODEL_PERSIST_KEY } from "~/components/chat/model-selector";
import { inputStore } from "~/components/chat/stores";
import { Button } from "~/components/ui/button";
import {
  PromptInput,
  PromptInputAction,
  PromptInputActions,
  PromptInputTextarea,
} from "~/components/ui/prompt-input";
import { useFileAttachments } from "~/hooks/use-file-attachments";
import { useFileDrop } from "~/hooks/use-file-drop";
import { usePersisted } from "~/hooks/use-persisted";
import { STORAGE_KEYS } from "~/lib/constants";
import { api } from "~/lib/db/server";
import { logger } from "~/lib/logger";
import { getDefaultModel, getModelById, supportsModality } from "~/lib/models";
import { cn } from "~/lib/utils";

interface ChatInputProps {
  chatId?: string;
  sessionToken: string;
  disabled: boolean;
  addUserMessage: (message: string, attachments?: string[]) => void;
  onStop: () => void;
}

const ChatInput = memo(function ChatInput({
  chatId,
  sessionToken,
  disabled,
  addUserMessage,
  onStop,
}: ChatInputProps) {
  const navigate = useNavigate();
  const createChat = useMutation(api.functions.chat.createChat);

  const { value: selectedModelId } = usePersisted<number>(
    MODEL_PERSIST_KEY,
    getDefaultModel().id,
  );
  const [input, setInput] = useState(inputStore.getState().input);

  const currentModel = getModelById(selectedModelId);
  const supportsImages = currentModel
    ? supportsModality(currentModel, "image")
    : true;

  // Use custom hooks
  const {
    attachedFiles,
    fileUrls,
    handleFilesSelected,
    handleRemoveFileById,
    clearFiles,
  } = useFileAttachments();

  const { isDragOver, isDragOverTarget, dropProps } = useFileDrop({
    onDrop: handleFilesSelected,
    disabled: disabled || !supportsImages,
  });

  useEffect(() => {
    const unsubscribe = inputStore.subscribe((state) => {
      setInput(state.input);
    });
    return unsubscribe;
  }, []);

  const send = useCallback(
    async (text: string) => {
      if (!text && attachedFiles.length === 0) return;

      if (!chatId) {
        try {
          localStorage.setItem(STORAGE_KEYS.FIRST_MESSAGE, text || "");
          if (attachedFiles.length > 0) {
            inputStore.getState().setFiles(attachedFiles.map((af) => af.file));
          }

          const model = getModelById(selectedModelId);

          const newChatId = await createChat({
            sessionToken,
            title: "New Chat",
            visibility: "private",
            provider: model?.provider,
            model: model?.modelId,
          });

          logger.info(`Chat created successfully: ${newChatId}`);

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

      if (attachedFiles.length > 0) {
        logger.info(
          `Processing ${attachedFiles.length} file attachment(s) for chat: ${chatId || "new"}`,
        );

        const attachmentPromises = attachedFiles.map(async (attachedFile) => {
          const buffer = await attachedFile.file.arrayBuffer();
          const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
          return {
            name: attachedFile.file.name,
            size: attachedFile.file.size,
            type: attachedFile.file.type,
            data: base64,
          };
        });

        const attachmentData = await Promise.all(attachmentPromises);
        logger.info(
          `Stored ${attachmentData.length} attachment(s) in session storage for chat processing`,
        );
        sessionStorage.setItem(
          STORAGE_KEYS.PENDING_ATTACHMENTS,
          JSON.stringify(attachmentData),
        );
      } else {
        logger.debug("No attachments to process for message");
      }

      logger.info(
        `Sending message to chat ${chatId} with ${attachedFiles.length} attachment(s)`,
      );

      addUserMessage(text, []);

      clearFiles();
    },
    [
      chatId,
      sessionToken,
      createChat,
      navigate,
      addUserMessage,
      selectedModelId,
      attachedFiles,
      clearFiles,
    ],
  );

  const handleSubmit = useCallback(() => {
    const currentInput = inputStore.getState().input.trim();
    if (!currentInput && attachedFiles.length === 0) {
      return;
    }

    send(currentInput);
    setInput("");
    inputStore.getState().setInput("");
  }, [send, attachedFiles.length]);

  const isDisabled = useCallback(() => {
    return (
      disabled ||
      (!inputStore.getState().input.trim() && attachedFiles.length === 0)
    );
  }, [disabled, attachedFiles.length]);

  return (
    <div
      className="relative mx-auto flex w-full max-w-3xl flex-col overflow-hidden"
      onDrop={dropProps.onDrop}
    >
      <div className="-z-10 absolute inset-x-0 bottom-0 h-1/2 rounded-t-md bg-background" />
      <div className="relative w-full" {...dropProps}>
        <PromptInput
          value={input}
          onValueChange={(val) => {
            setInput(val);
            inputStore.getState().setInput(val);
          }}
          isLoading={disabled}
          onSubmit={handleSubmit}
          className="w-full"
        >
          <PromptInputTextarea placeholder="Ask anything" />

          <PromptInputActions className="flex items-center justify-between pt-2">
            <ChatOptions
              attachedFiles={attachedFiles}
              onFilesSelected={handleFilesSelected}
            />

            <PromptInputAction
              tooltip={disabled ? "Stop generation" : "Send message"}
              side="top"
            >
              {disabled ? (
                <Button
                  variant="default"
                  size="icon"
                  className="h-8 w-8"
                  onClick={onStop}
                >
                  <Square className="h-4 w-4 fill-background" />
                </Button>
              ) : (
                <Button
                  variant="default"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  onClick={handleSubmit}
                  disabled={isDisabled()}
                >
                  <ArrowUpIcon className="h-4 w-4" />
                </Button>
              )}
            </PromptInputAction>
          </PromptInputActions>
          <FilePills
            files={attachedFiles.map((file, index) => ({
              id: `file-${index}`,
              name: file.file.name,
              size: file.file.size,
              type: file.file.type,
              url: fileUrls.get(`file-${index}`),
            }))}
            onRemove={handleRemoveFileById}
            className="mt-2 border-input border-t px-2 py-2"
          />
        </PromptInput>

        {isDragOver && supportsImages && (
          <div
            className={cn(
              "pointer-events-none absolute inset-0 z-10 rounded-md border-1 border-primary border-dashed bg-background",
            )}
          >
            <div
              className={cn(
                "flex h-full w-full items-center justify-center rounded-md",
                isDragOverTarget ? "bg-primary/30" : "bg-primary/20",
              )}
            >
              <div className="flex items-center gap-x-2">
                <Paperclip className="h-5 w-5 text-primary" />
                <p className="font-medium text-primary text-sm">
                  Drop files here to add to chat
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export { ChatInput };
