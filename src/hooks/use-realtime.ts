"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { realtime, asAttendance, asLeaveRequest } from "@/lib/realtime";
import { useAttendanceStore, useLeaveStore } from "@/store/domain-store";
import { useUiStore } from "@/store/ui-store";
import { LEAVE_TYPE_LABELS } from "@/constants";

/**
 * Global realtime binding:
 *  - connects the socket (or simulator)
 *  - mirrors events into Zustand stores
 *  - fires toast notifications
 *  - invalidates React Query caches so every page refreshes live
 */
export function useRealtimeBridge() {
  const queryClient = useQueryClient();

  useEffect(() => {
    realtime.connect();
    const offStatus = realtime.onStatus((status) => {
      // expose for the connection indicator component
      window.dispatchEvent(new CustomEvent("shifttrack:ws-status", { detail: status }));
    });

    const off = realtime.on((event) => {
      switch (event.event) {
        case "clock:in":
        case "clock:out":
        case "attendance:update": {
          const rec = asAttendance(event.payload);
          useAttendanceStore.getState().upsert(rec);
          if (event.event === "clock:in") {
            toast.success(`${rec.employeeName} clocked in`, {
              description: new Date(event.at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
            });
          } else if (event.event === "clock:out") {
            toast.message(`${rec.employeeName} clocked out`, {
              description: `Session: ${Math.round((rec.durationMinutes ?? 0) / 60)}h`,
            });
          }
          break;
        }
        case "leave:new": {
          const req = asLeaveRequest(event.payload);
          useLeaveStore.getState().upsert(req);
          toast.info(`New leave request — ${req.employeeName}`, {
            description: `${LEAVE_TYPE_LABELS[req.type] ?? req.type} · ${req.days} day${req.days > 1 ? "s" : ""}`,
          });
          break;
        }
        case "leave:decision": {
          const req = asLeaveRequest(event.payload);
          useLeaveStore.getState().upsert(req);
          break;
        }
      }

      // Keep every live surface fresh
      void queryClient.invalidateQueries({ queryKey: ["overview"] });
      void queryClient.invalidateQueries({ queryKey: ["attendance"] });
      void queryClient.invalidateQueries({ queryKey: ["stats"] });
    });

    return () => {
      off();
      offStatus();
    };
  }, [queryClient]);
}
