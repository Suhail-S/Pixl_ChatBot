import { create } from "zustand";

interface UserProfile {
  userType: string | null;
  answers: Record<string, string | string[]>;
  setUserType: (type: string) => void;
  addAnswer: (key: string, value: string | string[]) => void;
  resetProfile: () => void;
}

export const useUserStore = create<UserProfile>((set) => ({
  userType: null,
  answers: {},
  setUserType: (type) => set({ userType: type }),
  addAnswer: (key, value) =>
    set((state) => ({ answers: { ...state.answers, [key]: value } })),
  resetProfile: () => set({ userType: null, answers: {} }),
}));
