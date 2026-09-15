import { db, isoDay } from "./db";
import { makeRng } from "@/lib/rng";
import type {
  AttendanceTrendPoint,
  CurrentlyClockedIn,
  DashboardStats,
  DepartmentDistribution,
  OverviewSnapshot,
  PendingApproval,
  RecentActivity,
  ReportSummary,
  UpcomingShift,
} from "@/types";

function minutesSince(iso: string): number {
  return Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
}

export function buildDashboardStats(): DashboardStats {
  const today = isoDay(new Date());
  const todayRows = db.listAttendance({ date: today });
  const activeEmployees = db.employees.filter((e) => e.status !== "inactive");

  const present = todayRows.filter((r) => r.status === "present" || r.status === "remote").length;
  const late = todayRows.filter((r) => r.status === "late").length;
  const onLeave = todayRows.filter((r) => r.status === "on_leave").length;
  const expected = activeEmployees.length;
  const absent = Math.max(0, expected - present - late - onLeave);
  const currentlyClockedIn = todayRows.filter((r) => r.clockIn && !r.clockOut);
  const pending = db.leaveRequests.filter((r) => r.status === "pending").length;
  const activeShifts = db.shifts.filter((s) => s.status === "active").length;

  return {
    totalEmployees: db.employees.length,
    presentToday: present + late,
    absentToday: absent,
    lateToday: late,
    onLeaveToday: onLeave,
    pendingLeaveRequests: pending,
    activeShifts,
    currentlyClockedIn: currentlyClockedIn.length,
    averageClockIn: "09:06",
    attendanceRate: expected ? Math.round(((present + late) / expected) * 100) : 0,
    deltas: {
      totalEmployees: 2.4,
      presentToday: 1.8,
      absentToday: -0.6,
      lateToday: -12.5,
      pendingLeaveRequests: 3.1,
      activeShifts: 0,
    },
  };
}

export function buildCurrentlyClockedIn(): CurrentlyClockedIn[] {
  const today = isoDay(new Date());
  return db
    .listAttendance({ date: today })
    .filter((r) => r.clockIn && !r.clockOut)
    .map((r) => ({
      employeeId: r.employeeId,
      employeeName: r.employeeName,
      department: r.department,
      clockInAt: r.clockIn as string,
      durationMinutes: minutesSince(r.clockIn as string),
      status: r.status,
    }))
    .sort((a, b) => a.durationMinutes - b.durationMinutes);
}

export function buildRecentActivities(): RecentActivity[] {
  const rng = makeRng(1337);
  const acts: RecentActivity[] = [];
  const recentLeave = db.leaveRequests.slice(0, 6);
  for (const lr of recentLeave) {
    acts.push({
      id: `act_leave_${lr.id}`,
      type: "leave_requested",
      actor: lr.employeeName,
      message: `requested ${lr.days}d ${lr.type} leave`,
      at: lr.submittedAt,
    });
  }
  const today = isoDay(new Date());
  const todayRows = db.listAttendance({ date: today }).filter((r) => r.clockIn);
  const sample = todayRows.slice(0, 10);
  for (const r of sample) {
    const type = r.clockOut ? "clock_out" : "clock_in";
    acts.push({
      id: `act_att_${r.id}`,
      type,
      actor: r.employeeName,
      message: r.clockOut
        ? `clocked out after ${Math.round((r.durationMinutes ?? 0) / 60)}h`
        : `clocked in ${r.status === "late" ? "(late)" : ""}`.trim(),
      at: (r.clockOut ?? r.clockIn) as string,
    });
  }
  return acts.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()).slice(0, 10);
}

export function buildPendingApprovals(): PendingApproval[] {
  return db.leaveRequests
    .filter((r) => r.status === "pending")
    .slice(0, 5)
    .map((r) => ({
      id: r.id,
      employeeName: r.employeeName,
      type: r.type,
      days: r.days,
      fromDate: r.fromDate,
      toDate: r.toDate,
      submittedAt: r.submittedAt,
    }));
}

export function buildUpcomingShifts(): UpcomingShift[] {
  const today = new Date();
  return db.listShifts()
    .filter((s) => s.status === "active")
    .slice(0, 5)
    .map((s) => {
      const date = new Date(today);
      date.setDate(date.getDate() + 1);
      return {
        id: s.id,
        shiftName: s.name,
        department: s.department,
        startTime: s.startTime,
        endTime: s.endTime,
        assignedCount: s.assignedEmployeeIds.length,
        date: isoDay(date),
        color: s.color,
      };
    });
}

function buildTrend(days: number): AttendanceTrendPoint[] {
  const out: AttendanceTrendPoint[] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateISO = isoDay(d);
    const rows = db.listAttendance({ date: dateISO });
    out.push({
      date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      present: rows.filter((r) => r.status === "present" || r.status === "remote").length,
      late: rows.filter((r) => r.status === "late").length,
      absent: rows.filter((r) => r.status === "absent").length,
      onLeave: rows.filter((r) => r.status === "on_leave").length,
    });
  }
  return out;
}

export function buildDepartmentDistribution(): DepartmentDistribution[] {
  const today = isoDay(new Date());
  const todayRows = db.listAttendance({ date: today });
  const byDept = new Map<string, DepartmentDistribution>();
  for (const emp of db.employees) {
    if (emp.status === "inactive") continue;
    const entry = byDept.get(emp.department) ?? { department: emp.department, employees: 0, present: 0 };
    entry.employees++;
    const row = todayRows.find((r) => r.employeeId === emp.id);
    if (row && (row.status === "present" || row.status === "remote" || row.status === "late")) entry.present++;
    byDept.set(emp.department, entry);
  }
  return Array.from(byDept.values()).sort((a, b) => b.employees - a.employees);
}

export function buildOverviewSnapshot(): OverviewSnapshot {
  return {
    stats: buildDashboardStats(),
    clockedIn: buildCurrentlyClockedIn(),
    activities: buildRecentActivities(),
    pendingApprovals: buildPendingApprovals(),
    upcomingShifts: buildUpcomingShifts(),
    weeklyTrend: buildTrend(7),
    monthlyTrend: buildTrend(30),
    departmentDistribution: buildDepartmentDistribution(),
  };
}

export function buildReportSummary(range: "daily" | "weekly" | "monthly"): ReportSummary {
  const days = range === "daily" ? 1 : range === "weekly" ? 7 : 30;
  const today = new Date();
  const start = new Date(today);
  start.setDate(start.getDate() - (days - 1));
  const rows = db.listAttendanceRange(isoDay(start), isoDay(today));

  const presentRows = rows.filter((r) => r.status === "present" || r.status === "remote");
  const lateRows = rows.filter((r) => r.status === "late");
  const absentRows = rows.filter((r) => r.status === "absent");
  const leaveRows = rows.filter((r) => r.status === "on_leave");
  const closed = rows.filter((r) => r.durationMinutes != null);
  const totalHours = closed.reduce((sum, r) => sum + (r.durationMinutes ?? 0), 0) / 60;
  const overtimeHours = closed.reduce((sum, r) => sum + Math.max(0, (r.durationMinutes ?? 0) - 480), 0) / 60;

  const capacity = db.shifts.reduce((sum, s) => sum + Math.max(s.assignedEmployeeIds.length, 1), 0);
  const assigned = db.shifts.reduce((sum, s) => sum + s.assignedEmployeeIds.length, 0);

  const perEmployee = new Map<string, { name: string; dept: string; present: number }>();
  for (const r of presentRows.concat(lateRows)) {
    const e = perEmployee.get(r.employeeId) ?? { name: r.employeeName, dept: r.department, present: 0 };
    e.present++;
    perEmployee.set(r.employeeId, e);
  }
  const topAttendees = Array.from(perEmployee.values())
    .sort((a, b) => b.present - a.present)
    .slice(0, 5)
    .map((e) => ({
      employeeName: e.name,
      department: e.dept,
      presentDays: e.present,
      rate: Math.round((e.present / Math.max(days, 1)) * 100),
    }));

  const leaveByType = (t: string) =>
    db.leaveRequests.filter(
      (r) =>
        r.type === t &&
        r.status === "approved" &&
        r.fromDate <= isoDay(today) &&
        r.toDate >= isoDay(start),
    ).reduce((sum, r) => sum + r.days, 0);

  return {
    label: range.charAt(0).toUpperCase() + range.slice(1),
    range: `${isoDay(start)} → ${isoDay(today)}`,
    attendanceRate: rows.length ? Math.round(((presentRows.length + lateRows.length) / rows.length) * 100) : 0,
    totalHours: Math.round(totalHours),
    overtimeHours: Math.round(overtimeHours * 10) / 10,
    lateArrivals: lateRows.length,
    absentDays: absentRows.length,
    leaveDaysTaken: leaveRows.length,
    shiftUtilization: capacity ? Math.round((assigned / capacity) * 100) : 0,
    trend: buildTrend(days),
    leaveTrend: [
      { label: "Annual", annual: leaveByType("annual"), sick: 0, casual: 0, unpaid: 0 },
      { label: "Sick", annual: 0, sick: leaveByType("sick"), casual: 0, unpaid: 0 },
      { label: "Casual", annual: 0, sick: 0, casual: leaveByType("casual"), unpaid: 0 },
      { label: "Unpaid", annual: 0, sick: 0, casual: 0, unpaid: leaveByType("unpaid") },
    ],
    shiftUtilizationBars: db.listShifts()
      .filter((s) => s.status === "active")
      .slice(0, 6)
      .map((s) => ({
        shift: s.name,
        utilization: Math.min(100, Math.round((s.assignedEmployeeIds.length / 14) * 100)),
        assigned: s.assignedEmployeeIds.length,
        capacity: 14,
      })),
    topAttendees,
  };
}
