import { useStore } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { createStore } from "zustand/vanilla";
import { type ChatMessage, ChatStatus } from "~/components/chat/types";

interface ChatState {
  messages: ChatMessage[];
  status: ChatStatus;
  abortController: AbortController | null;
  currentChatId: string | undefined;
  isInitialLoad: boolean;
  pollEnabled: boolean;
}

interface ChatActions {
  resetChat: (chatId: string | undefined) => void;
  setMessages: (messages: ChatMessage[]) => void;
  addMessages: (messages: ChatMessage[]) => void;
  updateLastMessage: (updates: Partial<ChatMessage>) => void;
  setStatus: (status: ChatStatus) => void;
  setAbortController: (controller: AbortController | null) => void;
  setInitialLoad: (isInitialLoad: boolean) => void;
  setPollEnabled: (enabled: boolean) => void;
}

type ChatStore = ChatState & ChatActions;

const createChatStore = (chatId: string | undefined) =>
  createStore<ChatStore>()(
    subscribeWithSelector((set, get) => ({
      messages: [],
      status: ChatStatus.IDLE,
      abortController: null,
      currentChatId: chatId,
      isInitialLoad: true,
      pollEnabled: false,

      resetChat: (chatId: string | undefined) => {
        const state = get();
        if (state.abortController) {
          state.abortController.abort();
        }
        set({
          messages: [],
          status: ChatStatus.IDLE,
          abortController: null,
          currentChatId: chatId,
          isInitialLoad: true,
          pollEnabled: false,
        });
      },

      setMessages: (messages: ChatMessage[]) => set({ messages }),

      addMessages: (newMessages: ChatMessage[]) =>
        set((state) => ({ messages: [...state.messages, ...newMessages] })),

      updateLastMessage: (updates: Partial<ChatMessage>) =>
        set((state) => ({
          messages: state.messages.map((msg, index) =>
            index === state.messages.length - 1 ? { ...msg, ...updates } : msg,
          ),
        })),

      setStatus: (status: ChatStatus) => set({ status }),

      setAbortController: (abortController: AbortController | null) =>
        set({ abortController }),

      setInitialLoad: (isInitialLoad: boolean) => set({ isInitialLoad }),

      setPollEnabled: (pollEnabled: boolean) => set({ pollEnabled }),
    })),
  );

const chatStores = new Map<string, ReturnType<typeof createChatStore>>();

export const getChatStore = (chatId: string | undefined) => {
  const key = chatId || "default";

  if (!chatStores.has(key)) {
    chatStores.set(key, createChatStore(chatId));
  }

  const store = chatStores.get(key);
  if (!store) {
    throw new Error(`Failed to create chat store for key: ${key}`);
  }

  return store;
};

export const useChatStore = (chatId: string | undefined) => {
  const store = getChatStore(chatId);
  return store.getState();
};

export const useChatStoreSubscription = <T>(
  chatId: string | undefined,
  selector: (state: ChatStore) => T,
) => {
  const store = getChatStore(chatId);
  return useStore(store, selector);
};
