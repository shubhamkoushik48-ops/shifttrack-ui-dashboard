"use client";

import { create } from "zustand";
import type { AttendanceRecord, Employee, LeaveRequest, Shift } from "@/types";

/**
 * Domain stores — client-side caches of "live" data mirrored from the socket
 * event bus. React Query remains the source of truth for fetching; these
 * stores give any component synchronous access to the latest realtime state.
 */

interface EmployeeState {
  employees: Map<string, Employee>;
  upsert: (employee: Employee) => void;
  remove: (id: string) => void;
  hydrate: (rows: Employee[]) => void;
}

export const useEmployeeStore = create<EmployeeState>((set) => ({
  employees: new Map(),
  upsert: (employee) =>
    set((s) => {
      const next = new Map(s.employees);
      next.set(employee.id, employee);
      return { employees: next };
    }),
  remove: (id) =>
    set((s) => {
      const next = new Map(s.employees);
      next.delete(id);
      return { employees: next };
    }),
  hydrate: (rows) =>
    set(() => ({ employees: new Map(rows.map((r) => [r.id, r])) })),
}));

interface AttendanceState {
  records: Map<string, AttendanceRecord>;
  upsert: (record: AttendanceRecord) => void;
  hydrate: (rows: AttendanceRecord[]) => void;
  openRecordFor: (employeeId: string) => AttendanceRecord | undefined;
}

export const useAttendanceStore = create<AttendanceState>((set, get) => ({
  records: new Map(),
  upsert: (record) =>
    set((s) => {
      const next = new Map(s.records);
      next.set(record.id, record);
      return { records: next };
    }),
  hydrate: (rows) =>
    set(() => ({ records: new Map(rows.map((r) => [r.id, r])) })),
  openRecordFor: (employeeId) =>
    Array.from(get().records.values()).find((r) => r.employeeId === employeeId && r.clockIn && !r.clockOut),
}));

interface LeaveState {
  requests: Map<string, LeaveRequest>;
  upsert: (request: LeaveRequest) => void;
  hydrate: (rows: LeaveRequest[]) => void;
  pendingCount: () => number;
}

export const useLeaveStore = create<LeaveState>((set, get) => ({
  requests: new Map(),
  upsert: (request) =>
    set((s) => {
      const next = new Map(s.requests);
      next.set(request.id, request);
      return { requests: next };
    }),
  hydrate: (rows) =>
    set(() => ({ requests: new Map(rows.map((r) => [r.id, r])) })),
  pendingCount: () =>
    Array.from(get().requests.values()).filter((r) => r.status === "pending").length,
}));

interface ShiftState {
  shifts: Map<string, Shift>;
  upsert: (shift: Shift) => void;
  remove: (id: string) => void;
  hydrate: (rows: Shift[]) => void;
}

export const useShiftStore = create<ShiftState>((set) => ({
  shifts: new Map(),
  upsert: (shift) =>
    set((s) => {
      const next = new Map(s.shifts);
      next.set(shift.id, shift);
      return { shifts: next };
    }),
  remove: (id) =>
    set((s) => {
      const next = new Map(s.shifts);
      next.delete(id);
      return { shifts: next };
    }),
  hydrate: (rows) =>
    set(() => ({ shifts: new Map(rows.map((r) => [r.id, r])) })),
}));
