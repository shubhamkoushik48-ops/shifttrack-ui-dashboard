"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthSession, AuthUser } from "@/types";

interface AuthState {
  session: AuthSession | null;
  hydrated: boolean;
  login: (session: AuthSession) => void;
  setUser: (user: AuthUser) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      session: null,
      hydrated: false,
      login: (session) => set({ session }),
      setUser: (user) =>
        set((state) =>
          state.session ? { session: { ...state.session, user } } : state,
        ),
      logout: () => set({ session: null }),
    }),
    {
      name: "shifttrack.session",
      partialize: (state) => ({ session: state.session }),
      onRehydrateStorage: () => () => {
        useAuthStore.setState({ hydrated: true });
      },
    },
  ),
);

export function useIsAuthenticated(): boolean {
  const session = useAuthStore((s) => s.session);
  return !!session && session.expiresAt > Date.now();
}
