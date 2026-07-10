import { create } from "zustand";
export const useSessionStore = create<{ token?: string; userId?: string; setSession: (token?: string, userId?: string) => void }>((set) => ({
  setSession: (token, userId) => set({ token, userId })
}));
