import { create } from "zustand";

interface MessageStore {
  firstMessage: string | null;
  hasBeenSent: boolean;
  setFirstMessage: (message: string) => void;
  markAsSent: () => void;
  clearFirstMessage: () => void;
}

export const useMessageStore = create<MessageStore>((set) => ({
  firstMessage: null,
  hasBeenSent: false,
  setFirstMessage: (message: string) =>
    set({ firstMessage: message, hasBeenSent: false }),
  markAsSent: () => set({ hasBeenSent: true }),
  clearFirstMessage: () => set({ firstMessage: null, hasBeenSent: false }),
}));
