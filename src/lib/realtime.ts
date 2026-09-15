"use client";

import { io, type Socket } from "socket.io-client";
import { db, isoDay } from "@/mock/db";
import type { AttendanceRecord, Employee, LeaveRequest, Shift, RealtimeStatus } from "@/types";

export type RealtimeEventName =
  | "attendance:update"
  | "clock:in"
  | "clock:out"
  | "leave:new"
  | "leave:decision"
  | "shift:update"
  | "employee:update";

export interface RealtimeEvent<T = unknown> {
  event: RealtimeEventName;
  payload: T;
  at: string;
}

type Listener = (event: RealtimeEvent) => void;

const EVENT_NAMES: RealtimeEventName[] = [
  "attendance:update",
  "clock:in",
  "clock:out",
  "leave:new",
  "leave:decision",
  "shift:update",
  "employee:update",
];

/**
 * Realtime client.
 *
 * - If NEXT_PUBLIC_WS_URL is set, connects to a real Socket.IO server.
 * - Otherwise runs a built-in simulator that emits realistic events
 *   (clock-ins, clock-outs, leave requests) so the whole UI pipeline —
 *   stores, toasts, live KPIs, reconnect banner — is exercised offline.
 */
class RealtimeClient {
  private socket: Socket | null = null;
  private listeners = new Set<Listener>();
  private statusListeners = new Set<(s: RealtimeStatus) => void>();
  private simTimer: ReturnType<typeof setInterval> | null = null;
  private latencyTimer: ReturnType<typeof setInterval> | null = null;
  private status: RealtimeStatus = {
    connected: false,
    connecting: false,
    reconnectAttempt: 0,
    lastEventAt: null,
    latencyMs: null,
  };
  private attempt = 0;

  connect() {
    if (this.socket || this.simTimer) return;

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL;
    const enabled = process.env.NEXT_PUBLIC_ENABLE_WS === "true";

    if (wsUrl && enabled) {
      this.status = { ...this.status, connecting: true };
      this.emitStatus();
      this.socket = io(wsUrl, {
        transports: ["websocket"],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 800,
        reconnectionDelayMax: 8000,
        timeout: 8000,
      });

      this.socket.on("connect", () => {
        this.attempt = 0;
        this.status = { ...this.status, connected: true, connecting: false, reconnectAttempt: 0 };
        this.emitStatus();
      });
      this.socket.on("disconnect", () => {
        this.status = { ...this.status, connected: false };
        this.emitStatus();
      });
      this.socket.on("reconnect_attempt", () => {
        this.attempt++;
        this.status = { ...this.status, reconnectAttempt: this.attempt };
        this.emitStatus();
      });
      this.socket.onAny((event: string, payload: unknown) => {
        if (EVENT_NAMES.includes(event as RealtimeEventName)) {
          this.dispatch({ event: event as RealtimeEventName, payload, at: new Date().toISOString() });
        }
      });
    } else {
      this.startSimulator();
    }
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
    if (this.simTimer) {
      clearInterval(this.simTimer);
      this.simTimer = null;
    }
    if (this.latencyTimer) {
      clearInterval(this.latencyTimer);
      this.latencyTimer = null;
    }
    this.status = { connected: false, connecting: false, reconnectAttempt: 0, lastEventAt: this.status.lastEventAt, latencyMs: null };
    this.emitStatus();
  }

  getStatus(): RealtimeStatus {
    return this.status;
  }

  on(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  onStatus(listener: (s: RealtimeStatus) => void): () => void {
    this.statusListeners.add(listener);
    return () => this.statusListeners.delete(listener);
  }

  private dispatch(event: RealtimeEvent) {
    this.status = { ...this.status, lastEventAt: event.at };
    this.emitStatus();
    this.listeners.forEach((l) => l(event));
  }

  private emitStatus() {
    this.statusListeners.forEach((l) => l(this.status));
  }

  // ── Simulator ─────────────────────────────────────────────────────────
  private startSimulator() {
    // Simulate graceful connect
    this.status = { ...this.status, connecting: true };
    this.emitStatus();
    setTimeout(() => {
      this.status = { ...this.status, connected: true, connecting: false };
      this.emitStatus();
    }, 900);

    // Latency pings
    this.latencyTimer = setInterval(() => {
      if (this.status.connected) {
        this.status = { ...this.status, latencyMs: 12 + Math.floor(Math.random() * 30) };
        this.emitStatus();
      }
    }, 5000);

    // Random workforce events every 6–14s
    const tick = () => {
      if (!this.status.connected) return;
      const roll = Math.random();
      const today = isoDay(new Date());

      if (roll < 0.4) {
        // Clock-in
        const candidates = db.employees.filter((e) => {
          if (e.status !== "active") return false;
          const rec = db.attendance.find((r) => r.employeeId === e.id && r.date === today);
          return !rec || (!rec.clockIn && rec.status !== "on_leave");
        });
        const emp = candidates[Math.floor(Math.random() * candidates.length)];
        if (emp) {
          const rec = db.clockIn(emp.id);
          this.dispatch({ event: "clock:in", payload: rec, at: new Date().toISOString() });
        }
      } else if (roll < 0.7) {
        // Clock-out
        const open = db.attendance.find((r) => r.date === today && r.clockIn && !r.clockOut);
        if (open) {
          const rec = db.clockOut(open.employeeId);
          if (rec) this.dispatch({ event: "clock:out", payload: rec, at: new Date().toISOString() });
        }
      } else if (roll < 0.85) {
        // New leave request
        const actives = db.employees.filter((e) => e.status === "active");
        const emp = actives[Math.floor(Math.random() * actives.length)];
        if (emp) {
          const days = 1 + Math.floor(Math.random() * 4);
          const from = new Date();
          from.setDate(from.getDate() + 3 + Math.floor(Math.random() * 20));
          const to = new Date(from);
          to.setDate(to.getDate() + days - 1);
          const req = db.createLeaveRequest({
            employeeId: emp.id,
            employeeName: emp.name,
            department: emp.department,
            type: (["annual", "sick", "casual"] as const)[Math.floor(Math.random() * 3)],
            fromDate: isoDay(from),
            toDate: isoDay(to),
            days,
            reason: "Submitted via mobile app",
          });
          this.dispatch({ event: "leave:new", payload: req, at: new Date().toISOString() });
        }
      } else {
        // Attendance correction (status change)
        const todayRows = db.attendance.filter((r) => r.date === today && r.clockIn);
        const row = todayRows[Math.floor(Math.random() * todayRows.length)];
        if (row) {
          const rec = db.updateAttendanceStatus(row.employeeId, row.date, Math.random() > 0.5 ? "remote" : "present");
          if (rec) this.dispatch({ event: "attendance:update", payload: rec, at: new Date().toISOString() });
        }
      }
    };

    const schedule = () => {
      this.simTimer = setTimeout(() => {
        tick();
        schedule();
      }, 6000 + Math.random() * 8000);
    };
    schedule();
  }
}

export const realtime = new RealtimeClient();

// Convenience helpers for typing payloads
export function asAttendance(payload: unknown): AttendanceRecord {
  return payload as AttendanceRecord;
}
export function asEmployee(payload: unknown): Employee {
  return payload as Employee;
}
export function asLeaveRequest(payload: unknown): LeaveRequest {
  return payload as LeaveRequest;
}
export function asShift(payload: unknown): Shift {
  return payload as Shift;
}
