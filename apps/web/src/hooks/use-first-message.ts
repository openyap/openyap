import { useMutation } from "convex/react";
import { useEffect } from "react";
import { inputStore } from "~/components/chat/stores";
import { STORAGE_KEYS } from "~/lib/constants";
import { api } from "~/lib/db/server";
import { isConvexId } from "~/lib/db/utils";
import type { SerializedFile } from "~/lib/file-utils";

interface UseFirstMessageProps {
  chatId: string | undefined;
  sessionToken: string | undefined;
  append: (params: {
    content: string;
    attachments?: SerializedFile[];
  }) => Promise<void>;
}

export function useFirstMessage({
  chatId,
  sessionToken,
  append,
}: UseFirstMessageProps) {
  const generateChatTitle = useMutation(api.functions.chat.generateChatTitle);

  useEffect(() => {
    async function sendFirstMessage() {
      const firstMessage = localStorage.getItem(STORAGE_KEYS.FIRST_MESSAGE);
      const firstMessageAttachments = inputStore
        .getState()
        .getPendingAttachments();

      if (
        chatId &&
        isConvexId<"chat">(chatId) &&
        (firstMessage !== null || firstMessageAttachments.length > 0)
      ) {
        if (firstMessage !== null) {
          localStorage.removeItem(STORAGE_KEYS.FIRST_MESSAGE);
        }
        if (firstMessageAttachments.length > 0) {
          inputStore.getState().clearFiles();
        }

        const titleMessage = firstMessage || "Shared an attachment";
        await generateChatTitle({
          message: titleMessage,
          chatId,
          sessionToken: sessionToken ?? "skip",
        });
        await append({
          content: firstMessage || "",
          attachments: firstMessageAttachments,
        });
      }
    }

    sendFirstMessage();
  }, [chatId, sessionToken, append, generateChatTitle]);
}
