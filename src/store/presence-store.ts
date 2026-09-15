"use client";

import { create } from "zustand";
import type { EmployeePresence, GeofenceEvent } from "@/types";

interface PresenceState {
  presence: Map<string, EmployeePresence>;
  upsert: (p: EmployeePresence) => void;
  applyGeofence: (e: GeofenceEvent) => void;
  hydrate: (rows: EmployeePresence[]) => void;
}

export const usePresenceStore = create<PresenceState>((set, get) => ({
  presence: new Map<string, EmployeePresence>(),

  upsert: (p) =>
    set((state) => {
      const next = new Map(state.presence);
      next.set(p.employeeId, p);
      return { presence: next };
    }),

  applyGeofence: (e) =>
    set((state) => {
      const next = new Map(state.presence);
      const current = next.get(e.employeeId);
      if (!current) return state;

      const updated: EmployeePresence =
        e.type === "enter"
          ? {
              ...current,
              status: "on_site",
              locationId: e.locationId,
              locationName: e.locationName,
              arrivedAt: e.at,
              lastPingAt: e.at,
              x: current.x ?? 0.5,
              y: current.y ?? 0.5,
            }
          : {
              ...current,
              status: "checked_out",
              locationId: null,
              locationName: null,
              zoneId: null,
              zoneName: null,
              x: null,
              y: null,
              arrivedAt: null,
              lastPingAt: e.at,
            };

      next.set(e.employeeId, updated);
      return { presence: next };
    }),

  hydrate: (rows) =>
    set(() => {
      const map = new Map<string, EmployeePresence>();
      for (const row of rows) map.set(row.employeeId, row);
      return { presence: map };
    }),
}));

export function selectOnSite(state: PresenceState): EmployeePresence[] {
  return Array.from(state.presence.values()).filter((p) => p.status === "on_site");
}

export function selectZoneCounts(state: PresenceState, locationId: string): Map<string, number> {
  const counts = new Map<string, number>();
  for (const p of state.presence.values()) {
    if (p.status === "on_site" && p.locationId === locationId && p.zoneId) {
      counts.set(p.zoneId, (counts.get(p.zoneId) ?? 0) + 1);
    }
  }
  return counts;
}

export function selectLocationCounts(state: PresenceState): Map<string, number> {
  const counts = new Map<string, number>();
  for (const p of state.presence.values()) {
    if (p.status === "on_site" && p.locationId) {
      counts.set(p.locationId, (counts.get(p.locationId) ?? 0) + 1);
    }
  }
  return counts;
}

export function usePresenceList(): EmployeePresence[] {
  const rows = Array.from(usePresenceStore((s) => s.presence).values());
  return rows;
}

export function usePresenceById(employeeId: string): EmployeePresence | undefined {
  return usePresenceStore((s) => s.presence.get(employeeId));
}
