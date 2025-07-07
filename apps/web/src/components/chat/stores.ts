import { persist } from "zustand/middleware";
import { createStore } from "zustand/vanilla";

// TODO: move modelId to chat metadata

export interface AttachedFile {
  file: File;
  progress?: number;
  error?: string;
  attachmentId?: string;
}

export interface SerializedAttachedFile {
  name: string;
  size: number;
  type: string;
  lastModified: number;
  data: string; // base64 encoded
  progress?: number;
  error?: string;
  attachmentId?: string;
}

type InputStore = {
  input: string;
  disabled: boolean;
  attachedFiles: AttachedFile[];
  setInput: (input: string) => void;
  setDisabled: (disabled: boolean) => void;
  setFiles: (files: File[]) => void;
  removeFile: (index: number) => void;
  clearFiles: () => void;
  getPendingAttachments: () => SerializedAttachedFile[];
};

export const inputStore = createStore(
  persist<InputStore>(
    (set, _get) => ({
      input: "",
      disabled: false,
      attachedFiles: [],
      setInput: (input: string) => set({ input }),
      setDisabled: (disabled: boolean) => set({ disabled }),
      setFiles: (files: File[]) => {
        const newFiles: AttachedFile[] = files.map((file) => ({
          file,
          progress: 0,
        }));
        set((state) => {
          // Sync to sessionStorage
          const serializedFiles = newFiles.map(async (af: AttachedFile) => {
            const arrayBuffer = await af.file.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);
            const data = btoa(String.fromCharCode(...uint8Array));

            return {
              name: af.file.name,
              size: af.file.size,
              type: af.file.type,
              lastModified: af.file.lastModified,
              data,
              progress: af.progress,
              error: af.error,
              attachmentId: af.attachmentId,
            };
          });

          Promise.all(serializedFiles).then((files) => {
            sessionStorage.setItem("pendingAttachments", JSON.stringify(files));
          });

          return { attachedFiles: newFiles };
        });
      },
      removeFile: (index: number) =>
        set((state) => {
          const updatedFiles = state.attachedFiles.filter(
            (_, i) => i !== index,
          );

          // Sync to sessionStorage
          if (updatedFiles.length > 0) {
            const serializedFiles = updatedFiles.map(
              async (af: AttachedFile) => {
                const arrayBuffer = await af.file.arrayBuffer();
                const uint8Array = new Uint8Array(arrayBuffer);
                const data = btoa(String.fromCharCode(...uint8Array));

                return {
                  name: af.file.name,
                  size: af.file.size,
                  type: af.file.type,
                  lastModified: af.file.lastModified,
                  data,
                  progress: af.progress,
                  error: af.error,
                  attachmentId: af.attachmentId,
                };
              },
            );

            Promise.all(serializedFiles).then((files) => {
              sessionStorage.setItem(
                "pendingAttachments",
                JSON.stringify(files),
              );
            });
          } else {
            sessionStorage.removeItem("pendingAttachments");
          }

          return { attachedFiles: updatedFiles };
        }),
      clearFiles: () => {
        sessionStorage.removeItem("pendingAttachments");
        set({ attachedFiles: [] });
      },
      getPendingAttachments: () => {
        const serialized = sessionStorage.getItem("pendingAttachments");
        return serialized ? JSON.parse(serialized) : [];
      },
    }),
    {
      name: "input-store",
      // Don't persist files as they contain File objects which can't be serialized
      partialize: (state) => ({
        input: state.input,
        disabled: state.disabled,
        attachedFiles: [], // Files will be handled separately via sessionStorage
        setInput: state.setInput,
        setDisabled: state.setDisabled,
        setFiles: state.setFiles,
        removeFile: state.removeFile,
        clearFiles: state.clearFiles,
        getPendingAttachments: state.getPendingAttachments,
      }),
    },
  ),
);
