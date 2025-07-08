import { persist } from "zustand/middleware";
import { createStore } from "zustand/vanilla";
import { STORAGE_KEYS } from "~/lib/constants";
import {
  type AttachedFile,
  type SerializedFile,
  clearStoredFiles,
  loadFilesFromStorage,
  saveFilesToStorage,
  updateStoredFiles,
} from "~/lib/file-utils";

// TODO: move modelId to chat metadata - this should be stored per chat in Convex

type InputStore = {
  input: string;
  disabled: boolean;
  attachedFiles: AttachedFile[];
  setInput: (input: string) => void;
  setDisabled: (disabled: boolean) => void;
  setFiles: (files: File[]) => void;
  removeFile: (index: number) => void;
  clearFiles: () => void;
  getPendingAttachments: () => SerializedFile[];
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
        set(() => {
          // Use FileService for consistent storage handling
          saveFilesToStorage(files.map((f) => f)).catch((error) =>
            console.error("Failed to save files:", error),
          );
          return { attachedFiles: newFiles };
        });
      },
      removeFile: (index: number) =>
        set((state) => {
          const updatedFiles = state.attachedFiles.filter(
            (_, i) => i !== index,
          );

          // Use FileService for consistent storage handling
          updateStoredFiles(
            state.attachedFiles.map((af) => af.file),
            index,
          ).catch((error) => console.error("Failed to update files:", error));

          return { attachedFiles: updatedFiles };
        }),
      clearFiles: () => {
        clearStoredFiles();
        set({ attachedFiles: [] });
      },
      getPendingAttachments: () => {
        return loadFilesFromStorage();
      },
    }),
    {
      name: STORAGE_KEYS.INPUT_STORE,
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
