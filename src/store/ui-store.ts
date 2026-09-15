"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AppNotification } from "@/types";

interface UiState {
  sidebarCollapsed: boolean;
  mobileSidebarOpen: boolean;
  commandOpen: boolean;
  notifications: AppNotification[];
  toggleSidebar: () => void;
  setMobileSidebarOpen: (open: boolean) => void;
  setCommandOpen: (open: boolean) => void;
  pushNotification: (n: Omit<AppNotification, "id" | "at" | "read">) => void;
  markAllRead: () => void;
  markRead: (id: string) => void;
  clearNotifications: () => void;
}

const MAX_NOTIFICATIONS = 30;

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      mobileSidebarOpen: false,
      commandOpen: false,
      notifications: [],
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setMobileSidebarOpen: (open) => set({ mobileSidebarOpen: open }),
      setCommandOpen: (open) => set({ commandOpen: open }),
      pushNotification: (n) =>
        set((s) => ({
          notifications: [
            { ...n, id: `ntf_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, at: new Date().toISOString(), read: false },
            ...s.notifications,
          ].slice(0, MAX_NOTIFICATIONS),
        })),
      markAllRead: () =>
        set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),
      markRead: (id) =>
        set((s) => ({
          notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
        })),
      clearNotifications: () => set({ notifications: [] }),
    }),
    {
      name: "shifttrack.ui",
      partialize: (state) => ({ sidebarCollapsed: state.sidebarCollapsed, notifications: state.notifications.slice(0, 10) }),
    },
  ),
);
