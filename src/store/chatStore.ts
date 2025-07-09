import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Sender = "user" | "bot";
export type MessageType = "text" | "options" | "form" | "custom";

export interface ChatMessage {
  id: string;
  sender: Sender;
  type: MessageType;
  text?: string;
  payload?: unknown;
}

interface ChatState {
  messages: ChatMessage[];
  userMessage: string;
  setUserMessage: (msg: string) => void;
  addMessage: (msg: Omit<ChatMessage, "id">) => void;
  resetChat: () => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      messages: [],
      userMessage: "",
      setUserMessage: (msg: string) => set({ userMessage: msg }),
      addMessage: (msg: Omit<ChatMessage, "id">) =>
        set((state) => ({
          messages: [
            ...state.messages,
            { id: Math.random().toString(36).slice(2) + Date.now().toString(36), ...msg },
          ],
        })),
      resetChat: () => set({ messages: [], userMessage: "" }),
    }),
    { name: "chat-store" }
  ));