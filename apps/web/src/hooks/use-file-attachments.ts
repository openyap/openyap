import { useCallback, useEffect, useState } from "react";
import type { AttachedFile } from "~/components/chat/stores";
import { inputStore } from "~/components/chat/stores";

export function useFileAttachments() {
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>(
    inputStore.getState().attachedFiles
  );
  const [fileUrls, setFileUrls] = useState<Map<string, string>>(new Map());

  // Subscribe to input store changes
  useEffect(() => {
    const unsubscribe = inputStore.subscribe((state) => {
      setAttachedFiles(state.attachedFiles);
    });
    return unsubscribe;
  }, []);

  // Manage file URLs for image previews
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

  const handleRemoveFileById = useCallback((fileId: string) => {
    const attachedFiles = inputStore.getState().attachedFiles;
    const index = attachedFiles.findIndex((_, i) => `file-${i}` === fileId);
    if (index !== -1) {
      inputStore.getState().removeFile(index);
    }
  }, []);

  const clearFiles = useCallback(() => {
    inputStore.getState().clearFiles();
  }, []);

  return {
    attachedFiles,
    fileUrls,
    handleFilesSelected,
    handleRemoveFileById,
    clearFiles,
  };
}