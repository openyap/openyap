import { persist } from "zustand/middleware";
import { createStore } from "zustand/vanilla";

// TODO: move modelId to chat metadata

type InputStore = {
  input: string;
  disabled: boolean;
  setInput: (input: string) => void;
  setDisabled: (disabled: boolean) => void;
};

export const inputStore = createStore(
  persist<InputStore>(
    (set, _get) => ({
      input: "",
      disabled: false,
      setInput: (input: string) => set({ input }),
      setDisabled: (disabled: boolean) => set({ disabled }),
    }),
    { name: "input-store" },
  ),
);
