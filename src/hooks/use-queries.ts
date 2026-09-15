"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  attendanceService,
  dashboardService,
  employeeService,
  leaveService,
  reportService,
  shiftService,
  type EmployeeQuery,
} from "@/services";
import { getApiErrorMessage } from "@/lib/api-client";
import { isoDay } from "@/mock/db";
import type { Employee, LeaveRequest, Shift } from "@/types";

const IMMUTABLE_HYDRATION = { staleTime: 15_000, refetchOnWindowFocus: true } as const;

// ── Keys ────────────────────────────────────────────────────────────────
export const qk = {
  overview: ["overview"] as const,
  stats: ["stats"] as const,
  clockedIn: ["clockedIn"] as const,
  activities: ["activities"] as const,
  employees: (q: EmployeeQuery) => ["employees", q] as const,
  employeeOptions: ["employee-options"] as const,
  shifts: ["shifts"] as const,
  attendance: (q: { date: string; days?: number; status?: string }) =>
    ["attendance", q] as const,
  leave: (status: string) => ["leave", status] as const,
  report: (range: string) => ["report", range] as const,
};

// ── Dashboard ───────────────────────────────────────────────────────────
export function useOverview() {
  return useQuery({
    queryKey: qk.overview,
    queryFn: () => dashboardService.overview(),
    ...IMMUTABLE_HYDRATION,
  });
}

export function useStats() {
  return useQuery({
    queryKey: qk.stats,
    queryFn: () => dashboardService.stats(),
    ...IMMUTABLE_HYDRATION,
  });
}

// ── Employees ───────────────────────────────────────────────────────────
export function useEmployees(query: EmployeeQuery) {
  return useQuery({
    queryKey: qk.employees(query),
    queryFn: () => employeeService.list(query),
    placeholderData: (prev) => prev,
  });
}

export function useEmployeeOptions(enabled = true) {
  return useQuery({
    queryKey: qk.employeeOptions,
    queryFn: async () => {
      const res = await fetch("/api/employees/options").catch(() => null);
      if (res?.ok) return (await res.json()) as { id: string; name: string; department: string; shiftId: string | null }[];
      return null;
    },
    enabled,
    staleTime: 60_000,
  });
}

// ── Shifts ──────────────────────────────────────────────────────────────
export function useShifts() {
  return useQuery({
    queryKey: qk.shifts,
    queryFn: () => shiftService.list(),
    ...IMMUTABLE_HYDRATION,
  });
}

export function useCreateShift() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<Shift>) => shiftService.create(input),
    onSuccess: (shift) => {
      toast.success(`Shift “${shift.name}” created`);
      void qc.invalidateQueries({ queryKey: ["shifts"] });
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });
}

export function useUpdateShift() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Shift> }) => shiftService.update(id, patch),
    onSuccess: (shift) => {
      toast.success(`Shift “${shift.name}” updated`);
      void qc.invalidateQueries({ queryKey: ["shifts"] });
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });
}

export function useDeleteShift() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => shiftService.remove(id),
    onSuccess: () => {
      toast.success("Shift deleted");
      void qc.invalidateQueries({ queryKey: ["shifts"] });
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });
}

// ── Attendance ──────────────────────────────────────────────────────────
export function useAttendance(params: { date: string; days?: number; status?: string }) {
  return useQuery({
    queryKey: qk.attendance(params),
    queryFn: () => attendanceService.list(params),
    ...IMMUTABLE_HYDRATION,
  });
}

export function useClockInOut() {
  const qc = useQueryClient();
  const clockIn = useMutation({
    mutationFn: (employeeId: string) => attendanceService.clockIn(employeeId),
    onSuccess: (rec) => {
      toast.success(`Clocked in — ${rec.employeeName}`);
      void qc.invalidateQueries({ queryKey: ["attendance"] });
      void qc.invalidateQueries({ queryKey: ["overview"] });
      void qc.invalidateQueries({ queryKey: ["stats"] });
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });
  const clockOut = useMutation({
    mutationFn: (employeeId: string) => attendanceService.clockOut(employeeId),
    onSuccess: (rec) => {
      toast.success(`Clocked out — ${rec.employeeName}`, {
        description: `${Math.round((rec.durationMinutes ?? 0) / 60)}h logged`,
      });
      void qc.invalidateQueries({ queryKey: ["attendance"] });
      void qc.invalidateQueries({ queryKey: ["overview"] });
      void qc.invalidateQueries({ queryKey: ["stats"] });
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });
  return { clockIn, clockOut };
}

// ── Leave ───────────────────────────────────────────────────────────────
export function useLeaveRequests(status: string) {
  return useQuery({
    queryKey: qk.leave(status),
    queryFn: () => leaveService.list(status),
    ...IMMUTABLE_HYDRATION,
  });
}

export function useDecideLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action, note }: { id: string; action: "approve" | "reject"; note?: string }) =>
      leaveService.decide(id, action, note),
    onSuccess: (req) => {
      toast.success(
        req.status === "approved"
          ? `Approved — ${req.employeeName}`
          : `Rejected — ${req.employeeName}`,
        { description: "The employee has been notified." },
      );
      void qc.invalidateQueries({ queryKey: ["leave"] });
      void qc.invalidateQueries({ queryKey: ["overview"] });
      void qc.invalidateQueries({ queryKey: ["stats"] });
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });
}

// ── Reports ─────────────────────────────────────────────────────────────
export function useReport(range: "daily" | "weekly" | "monthly") {
  return useQuery({
    queryKey: qk.report(range),
    queryFn: () => reportService.summary(range),
    ...IMMUTABLE_HYDRATION,
  });
}

// ── Employees mutations ─────────────────────────────────────────────────
export function useCreateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<Employee>) => employeeService.create(input),
    onSuccess: (emp) => {
      toast.success(`${emp.name} joined the team`, { description: emp.employeeCode });
      void qc.invalidateQueries({ queryKey: ["employees"] });
      void qc.invalidateQueries({ queryKey: ["overview"] });
      void qc.invalidateQueries({ queryKey: ["stats"] });
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });
}

export function useUpdateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Employee> }) => employeeService.update(id, patch),
    onSuccess: (emp) => {
      toast.success(`${emp.name} updated`);
      void qc.invalidateQueries({ queryKey: ["employees"] });
      void qc.invalidateQueries({ queryKey: ["overview"] });
      void qc.invalidateQueries({ queryKey: ["stats"] });
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });
}

export function useDeactivateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => employeeService.deactivate(id),
    onSuccess: () => {
      toast.success("Employee deactivated");
      void qc.invalidateQueries({ queryKey: ["employees"] });
      void qc.invalidateQueries({ queryKey: ["overview"] });
      void qc.invalidateQueries({ queryKey: ["stats"] });
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });
}

export { isoDay };
