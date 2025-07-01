import { persist } from "zustand/middleware";
import { createStore } from "zustand/vanilla";

// TODO: move modelId to chat metadata

export interface AttachedFile {
  file: File;
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
  addFiles: (files: File[]) => void;
  removeFile: (index: number) => void;
  updateFileProgress: (index: number, progress: number) => void;
  updateFileError: (index: number, error: string) => void;
  updateFileAttachmentId: (index: number, attachmentId: string) => void;
  clearFiles: () => void;
};

export const inputStore = createStore(
  persist<InputStore>(
    (set, _get) => ({
      input: "",
      disabled: false,
      attachedFiles: [],
      setInput: (input: string) => set({ input }),
      setDisabled: (disabled: boolean) => set({ disabled }),
      addFiles: (files: File[]) => {
        const newFiles: AttachedFile[] = files.map((file) => ({
          file,
          progress: 0,
        }));
        set((state) => ({
          attachedFiles: [...state.attachedFiles, ...newFiles],
        }));
      },
      removeFile: (index: number) =>
        set((state) => ({
          attachedFiles: state.attachedFiles.filter((_, i) => i !== index),
        })),
      updateFileProgress: (index: number, progress: number) =>
        set((state) => ({
          attachedFiles: state.attachedFiles.map((file, i) =>
            i === index ? { ...file, progress } : file,
          ),
        })),
      updateFileError: (index: number, error: string) =>
        set((state) => ({
          attachedFiles: state.attachedFiles.map((file, i) =>
            i === index ? { ...file, error } : file,
          ),
        })),
      updateFileAttachmentId: (index: number, attachmentId: string) =>
        set((state) => ({
          attachedFiles: state.attachedFiles.map((file, i) =>
            i === index ? { ...file, attachmentId } : file,
          ),
        })),
      clearFiles: () => set({ attachedFiles: [] }),
    }),
    {
      name: "input-store",
      // Don't persist files as they contain File objects which can't be serialized
      partialize: (state) => ({
        input: state.input,
        disabled: state.disabled,
        attachedFiles: [],
        setInput: state.setInput,
        setDisabled: state.setDisabled,
        addFiles: state.addFiles,
        removeFile: state.removeFile,
        updateFileProgress: state.updateFileProgress,
        updateFileError: state.updateFileError,
        updateFileAttachmentId: state.updateFileAttachmentId,
        clearFiles: state.clearFiles,
      }),
    },
  ),
);
