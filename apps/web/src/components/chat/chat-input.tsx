import { isRedirect, useNavigate } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { ArrowUpIcon, Square } from "lucide-react";
import { memo, useCallback, useEffect, useState } from "react";
import { ChatOptions } from "~/components/chat/chat-options";
import { FilePills } from "~/components/chat/file-pills";
import { MODEL_PERSIST_KEY } from "~/components/chat/model-selector";
import { type AttachedFile, inputStore } from "~/components/chat/stores";
import { Button } from "~/components/ui/button";
import {
  PromptInput,
  PromptInputAction,
  PromptInputActions,
  PromptInputTextarea,
} from "~/components/ui/prompt-input";
import { usePersisted } from "~/hooks/use-persisted";
import { api } from "~/lib/db/server";
import { getDefaultModel, getModelById } from "~/lib/models";

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
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>(
    inputStore.getState().attachedFiles,
  );
  const [fileUrls, setFileUrls] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    const unsubscribe = inputStore.subscribe((state) => {
      setInput(state.input);
      setAttachedFiles(state.attachedFiles);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const newUrls = new Map<string, string>();

    attachedFiles.forEach((file, index) => {
      if (file.file.type.startsWith("image/")) {
        const key = `file-${index}`;
        const url = URL.createObjectURL(file.file);
        newUrls.set(key, url);
      }
    });

    setFileUrls((prevUrls) => {
      prevUrls.forEach((url, key) => {
        if (!newUrls.has(key)) {
          URL.revokeObjectURL(url);
        }
      });
      return newUrls;
    });

    return () => {
      for (const url of newUrls.values()) {
        URL.revokeObjectURL(url);
      }
    };
  }, [attachedFiles]);

  const handleFilesSelected = useCallback((files: File[]) => {
    inputStore.getState().addFiles(files);
  }, []);

  const _handleRemoveFile = useCallback((index: number) => {
    inputStore.getState().removeFile(index);
  }, []);

  const handleRemoveFileById = useCallback((fileId: string) => {
    const attachedFiles = inputStore.getState().attachedFiles;
    const index = attachedFiles.findIndex((_, i) => `file-${i}` === fileId);
    if (index !== -1) {
      inputStore.getState().removeFile(index);
    }
  }, []);

  const send = useCallback(
    async (input: string) => {
      const text = input.trim();
      if (!text && attachedFiles.length === 0) return;

      if (!chatId) {
        try {
          localStorage.setItem("firstMessage", text || "");

          if (attachedFiles.length > 0) {
            localStorage.setItem(
              "firstMessageAttachments",
              JSON.stringify(attachedFiles),
            );
          }

          const model = getModelById(selectedModelId);

          const newChatId = await createChat({
            sessionToken,
            title: "New Chat",
            visibility: "private",
            provider: model?.provider,
            model: model?.modelId,
          });

          console.log("[ChatView] New Chat ID: ", newChatId);

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
        console.log(
          "[ChatInput] Processing attachments:",
          attachedFiles.length,
          attachedFiles,
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
        console.log(
          "[ChatInput] Storing attachments in sessionStorage:",
          attachmentData,
        );
        sessionStorage.setItem(
          "pendingAttachments",
          JSON.stringify(attachmentData),
        );
      } else {
        console.log("[ChatInput] No attachments to process");
      }

      addUserMessage(text, []);

      inputStore.getState().clearFiles();
    },
    [
      chatId,
      sessionToken,
      createChat,
      navigate,
      addUserMessage,
      selectedModelId,
      attachedFiles,
    ],
  );

  const handleSubmit = useCallback(() => {
    const currentInput = inputStore.getState().input;
    send(currentInput);
    setInput("");
    inputStore.getState().setInput("");
    setAttachedFiles([]);
    inputStore.getState().clearFiles();
  }, [send]);

  const isDisabled = useCallback(() => {
    return (
      disabled ||
      (!inputStore.getState().input.trim() && attachedFiles.length === 0)
    );
  }, [disabled, attachedFiles.length]);

  return (
    <div className="mx-auto flex w-full max-w-full flex-col gap-2 overflow-hidden px-4 sm:max-w-2xl lg:max-w-4xl">
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
    </div>
  );
});

export { ChatInput };
