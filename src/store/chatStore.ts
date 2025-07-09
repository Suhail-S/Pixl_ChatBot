import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Sender = "user" | "bot";
export interface ChatMessage {
  sender: Sender;
  text: string;
}

interface ChatState {
  messages: ChatMessage[];
  userMessage: string;
  setUserMessage: (msg: string) => void;
  addMessage: (msg: ChatMessage) => void;
  resetChat: () => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      messages: [],
      userMessage: "",
      setUserMessage: (msg: string) => set({ userMessage: msg }),
      addMessage: (msg: ChatMessage) =>
        set((state) => ({ messages: [...state.messages, msg] })),
      resetChat: () => set({ messages: [], userMessage: "" }),
    }),
    { name: "chat-store" }
  )
);