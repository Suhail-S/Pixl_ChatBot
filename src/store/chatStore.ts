import { create } from "zustand";

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

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  userMessage: "",
  setUserMessage: (msg: string) => set({ userMessage: msg }),
  addMessage: (msg: ChatMessage) =>
    set((state) => ({
      messages: [...state.messages, msg],
    })),
  resetChat: () => set({ messages: [], userMessage: "" }),
}));