import { generateAttendance, generateEmployees, generateLeaveRequests, generateShifts, isoDay } from "./generators";
import { generateLocations, generatePresence } from "./locations";
import type {
  AttendanceRecord,
  BusinessLocation,
  BusinessLocationInput,
  Employee,
  EmployeePresence,
  GeofenceEvent,
  LeaveRequest,
  Shift,
} from "@/types";

/**
 * Deterministic in-memory "database".
 * Mirrors a REST backend: list/get/create/update/delete + aggregate endpoints.
 */
class MockDatabase {
  employees: Employee[] = [];
  shifts: Shift[] = [];
  attendance: AttendanceRecord[] = [];
  leaveRequests: LeaveRequest[] = [];
  locations: BusinessLocation[] = [];
  presence: EmployeePresence[] = [];
  private nextEmployeeNum = 49;

  constructor() {
    this.employees = generateEmployees(48);
    this.shifts = generateShifts(this.employees);
    this.attendance = generateAttendance(this.employees, 45);
    this.leaveRequests = generateLeaveRequests(this.employees);
    this.locations = generateLocations();
    this.presence = generatePresence(this.employees);
  }

  // ── Employees ─────────────────────────────────────────────────────────
  listEmployees(params: {
    page?: number;
    pageSize?: number;
    search?: string;
    department?: string;
    status?: string;
    sortBy?: string;
    sortDir?: "asc" | "desc";
  }) {
    const {
      page = 1,
      pageSize = 10,
      search = "",
      department = "all",
      status = "all",
      sortBy = "name",
      sortDir = "asc",
    } = params;

    let rows = [...this.employees];
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.email.toLowerCase().includes(q) ||
          e.employeeCode.toLowerCase().includes(q) ||
          e.designation.toLowerCase().includes(q),
      );
    }
    if (department !== "all") rows = rows.filter((e) => e.department === department);
    if (status !== "all") rows = rows.filter((e) => e.status === status);

    const dir = sortDir === "desc" ? -1 : 1;
    rows.sort((a, b) => {
      const ka = (a[sortBy as keyof Employee] as string) ?? "";
      const kb = (b[sortBy as keyof Employee] as string) ?? "";
      return ka.localeCompare(kb) * dir;
    });

    const total = rows.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const p = Math.min(page, totalPages);
    return {
      data: rows.slice((p - 1) * pageSize, p * pageSize),
      total,
      page: p,
      pageSize,
      totalPages,
    };
  }

  getEmployee(id: string) {
    return this.employees.find((e) => e.id === id) ?? null;
  }

  createEmployee(input: Partial<Employee>): Employee {
    const code = `EMP-${this.nextEmployeeNum.toString().padStart(4, "0")}`;
    const emp: Employee = {
      id: `emp_${this.nextEmployeeNum.toString().padStart(3, "0")}`,
      employeeCode: code,
      name: input.name ?? "New Employee",
      email: input.email ?? `${code.toLowerCase()}@shifttrack.io`,
      phone: input.phone ?? "—",
      department: input.department ?? "Engineering",
      designation: input.designation ?? "Specialist",
      status: input.status ?? "active",
      employmentType: input.employmentType ?? "full_time",
      shiftId: input.shiftId ?? null,
      joinDate: input.joinDate ?? new Date().toISOString(),
      location: input.location ?? "Remote",
      avatarSeed: input.name ?? code,
      createdAt: new Date().toISOString(),
    };
    this.nextEmployeeNum++;
    this.employees.unshift(emp);
    return emp;
  }

  updateEmployee(id: string, patch: Partial<Employee>): Employee | null {
    const emp = this.getEmployee(id);
    if (!emp) return null;
    Object.assign(emp, patch);
    return emp;
  }

  deleteEmployee(id: string): boolean {
    const before = this.employees.length;
    this.employees = this.employees.filter((e) => e.id !== id);
    return this.employees.length < before;
  }

  // ── Shifts ────────────────────────────────────────────────────────────
  listShifts() {
    return [...this.shifts];
  }

  getShift(id: string) {
    return this.shifts.find((s) => s.id === id) ?? null;
  }

  createShift(input: Partial<Shift>): Shift {
    const shift: Shift = {
      id: `shift_${Math.random().toString(36).slice(2, 8)}`,
      name: input.name ?? "Untitled Shift",
      startTime: input.startTime ?? "09:00",
      endTime: input.endTime ?? "17:00",
      department: input.department ?? "Engineering",
      color: input.color ?? "#2563EB",
      status: input.status ?? "active",
      assignedEmployeeIds: input.assignedEmployeeIds ?? [],
      days: input.days ?? [1, 2, 3, 4, 5],
    };
    this.shifts.push(shift);
    for (const empId of shift.assignedEmployeeIds) {
      const emp = this.getEmployee(empId);
      if (emp) emp.shiftId = shift.id;
    }
    return shift;
  }

  updateShift(id: string, patch: Partial<Shift>): Shift | null {
    const shift = this.getShift(id);
    if (!shift) return null;
    const before = new Set(shift.assignedEmployeeIds);
    Object.assign(shift, patch);
    const after = new Set(shift.assignedEmployeeIds);
    for (const empId of after) {
      if (!before.has(empId)) {
        const emp = this.getEmployee(empId);
        if (emp) emp.shiftId = shift.id;
      }
    }
    for (const empId of before) {
      if (!after.has(empId)) {
        const emp = this.getEmployee(empId);
        if (emp && emp.shiftId === shift.id) emp.shiftId = null;
      }
    }
    return shift;
  }

  deleteShift(id: string): boolean {
    const before = this.shifts.length;
    this.shifts = this.shifts.filter((s) => s.id !== id);
    if (this.shifts.length < before) {
      for (const emp of this.employees) if (emp.shiftId === id) emp.shiftId = null;
      return true;
    }
    return false;
  }

  // ── Attendance ────────────────────────────────────────────────────────
  listAttendance(params: { date?: string; employeeId?: string; status?: string; days?: number }) {
    const { date = isoDay(new Date()), employeeId, status, days = 1 } = params;
    let rows = this.attendance.filter((r) => r.date === date);
    if (days > 1) {
      const start = new Date(date);
      start.setDate(start.getDate() - (days - 1));
      const startISO = isoDay(start);
      rows = this.attendance.filter((r) => r.date >= startISO && r.date <= date);
    }
    if (employeeId) rows = rows.filter((r) => r.employeeId === employeeId);
    if (status && status !== "all") rows = rows.filter((r) => r.status === status);
    return rows;
  }

  listAttendanceRange(fromISO: string, toISO: string): AttendanceRecord[] {
    return this.attendance.filter((r) => r.date >= fromISO && r.date <= toISO);
  }

  clockIn(employeeId: string): AttendanceRecord {
    const emp = this.getEmployee(employeeId);
    if (!emp) throw new Error("Employee not found");
    const now = new Date();
    const record: AttendanceRecord = {
      id: `att_${employeeId}_${isoDay(now)}`,
      employeeId,
      employeeName: emp.name,
      department: emp.department,
      date: isoDay(now),
      clockIn: now.toISOString(),
      clockOut: null,
      durationMinutes: null,
      status: now.getHours() >= 10 ? "late" : "present",
      method: "web",
    };
    const existing = this.attendance.findIndex((r) => r.id === record.id);
    if (existing >= 0) this.attendance[existing] = record;
    else this.attendance.push(record);
    return record;
  }

  clockOut(employeeId: string): AttendanceRecord | null {
    const now = new Date();
    const rec = this.attendance.find(
      (r) => r.employeeId === employeeId && r.date === isoDay(now) && r.clockIn && !r.clockOut,
    );
    if (!rec) return null;
    rec.clockOut = now.toISOString();
    rec.durationMinutes = Math.max(
      0,
      Math.round((new Date(rec.clockOut).getTime() - new Date(rec.clockIn as string).getTime()) / 60000),
    );
    return rec;
  }

  updateAttendanceStatus(
    employeeId: string,
    date: string,
    status: AttendanceRecord["status"],
  ): AttendanceRecord | null {
    const rec = this.attendance.find((r) => r.employeeId === employeeId && r.date === date);
    if (!rec) return null;
    rec.status = status;
    return rec;
  }

  // ── Business locations ────────────────────────────────────────────────
  listLocations(): BusinessLocation[] {
    return [...this.locations];
  }

  getLocation(id: string) {
    return this.locations.find((l) => l.id === id) ?? null;
  }

  createLocation(input: Partial<BusinessLocationInput>): BusinessLocation {
    const location: BusinessLocation = {
      id: `loc_${Math.random().toString(36).slice(2, 8)}`,
      name: input.name ?? "New Office",
      address: input.address ?? "—",
      timezone: input.timezone ?? "UTC",
      latitude: input.latitude ?? 0,
      longitude: input.longitude ?? 0,
      geofenceRadiusM: input.geofenceRadiusM ?? 120,
      isHeadquarters: input.isHeadquarters ?? false,
      isOpen: true,
      manager: input.manager ?? "Unassigned",
      capacity: input.capacity ?? 40,
      zones: [
        { id: "z_1", name: "Main Floor", kind: "workspace", x: 0.05, y: 0.08, w: 0.55, h: 0.38 },
        { id: "z_2", name: "Meeting Room", kind: "meeting", x: 0.66, y: 0.08, w: 0.28, h: 0.18 },
        { id: "z_3", name: "Break Area", kind: "social", x: 0.05, y: 0.54, w: 0.4, h: 0.2 },
        { id: "z_4", name: "Reception", kind: "utility", x: 0.5, y: 0.54, w: 0.44, h: 0.2 },
      ],
      createdAt: new Date().toISOString(),
    };
    if (location.isHeadquarters) {
      for (const l of this.locations) l.isHeadquarters = false;
    }
    this.locations.push(location);
    return location;
  }

  updateLocation(id: string, patch: Partial<BusinessLocation>): BusinessLocation | null {
    const loc = this.getLocation(id);
    if (!loc) return null;
    Object.assign(loc, patch);
    if (patch.isHeadquarters) {
      for (const l of this.locations) if (l.id !== id) l.isHeadquarters = false;
    }
    return loc;
  }

  deleteLocation(id: string): boolean {
    const before = this.locations.length;
    this.locations = this.locations.filter((l) => l.id !== id);
    const removed = this.locations.length < before;
    if (removed) {
      for (const p of this.presence) {
        if (p.locationId === id) {
          p.locationId = null;
          p.locationName = null;
          p.zoneId = null;
          p.zoneName = null;
          p.x = null;
          p.y = null;
          p.status = "checked_out";
        }
      }
    }
    return removed;
  }

  listPresence(locationId?: string): EmployeePresence[] {
    const rows = locationId ? this.presence.filter((p) => p.locationId === locationId) : this.presence;
    return [...rows];
  }

  getPresenceFor(employeeId: string): EmployeePresence | null {
    return this.presence.find((p) => p.employeeId === employeeId) ?? null;
  }

  updatePresence(employeeId: string, patch: Partial<EmployeePresence>): EmployeePresence | null {
    const p = this.presence.find((x) => x.employeeId === employeeId) ?? null;
    if (!p) return null;
    Object.assign(p, patch);
    return p;
  }

  /** Simulator helper: nudge a random on-site employee within their zone. */
  moveRandomOnSiteEmployee(): EmployeePresence | null {
    const movers = this.presence.filter((p) => p.status === "on_site" && p.locationId && p.sharingEnabled);
    if (!movers.length) return null;
    const p = movers[Math.floor(Math.random() * movers.length)]!;
    const loc = this.getLocation(p.locationId!);
    const zone = loc?.zones.find((z) => z.id === p.zoneId) ?? loc?.zones[0];
    if (!loc || !zone) return null;
    p.x = Math.min(0.96, Math.max(0.04, zone.x + 0.06 + Math.random() * (zone.w - 0.12)));
    p.y = Math.min(0.96, Math.max(0.04, zone.y + 0.06 + Math.random() * (zone.h - 0.12)));
    p.lastPingAt = new Date().toISOString();
    p.accuracyM = 4 + Math.floor(Math.random() * 18);
    return { ...p };
  }

  /** Simulator helper: someone arrives at or leaves an office. */
  randomGeofenceTransition(): GeofenceEvent | null {
    const entering = this.presence.find((p) => p.status !== "on_site" && p.sharingEnabled);
    const leaving = this.presence.find((p) => p.status === "on_site" && p.sharingEnabled);
    const open = this.locations.filter((l) => l.isOpen);
    if (!open.length) return null;

    const willEnter = (entering ? 1 : 0) + (leaving ? 1 : 0) > 1 ? Math.random() < 0.5 : !!entering;
    if (willEnter && entering) {
      const loc = open[Math.floor(Math.random() * open.length)]!;
      const zone = loc.zones[Math.floor(Math.random() * loc.zones.length)] ?? null;
      entering.status = "on_site";
      entering.locationId = loc.id;
      entering.locationName = loc.name;
      entering.zoneId = zone?.id ?? null;
      entering.zoneName = zone?.name ?? null;
      entering.x = zone ? zone.x + 0.1 + Math.random() * Math.max(0.05, zone.w - 0.2) : null;
      entering.y = zone ? zone.y + 0.1 + Math.random() * Math.max(0.05, zone.h - 0.2) : null;
      entering.arrivedAt = new Date().toISOString();
      entering.lastPingAt = new Date().toISOString();
      return {
        type: "enter",
        employeeId: entering.employeeId,
        employeeName: entering.employeeName,
        locationId: loc.id,
        locationName: loc.name,
        at: new Date().toISOString(),
      };
    }
    if (leaving) {
      const locName = leaving.locationName ?? "office";
      leaving.status = "checked_out";
      leaving.locationId = null;
      leaving.locationName = null;
      leaving.zoneId = null;
      leaving.zoneName = null;
      leaving.x = null;
      leaving.y = null;
      leaving.arrivedAt = null;
      leaving.lastPingAt = new Date().toISOString();
      return {
        type: "exit",
        employeeId: leaving.employeeId,
        employeeName: leaving.employeeName,
        locationId: "",
        locationName: locName,
        at: new Date().toISOString(),
      }; 
    }
    return null;
  }

  // ── Leave ─────────────────────────────────────────────────────────────
  listLeaveRequests(status?: string) {
    const rows = [...this.leaveRequests];
    if (status && status !== "all") return rows.filter((r) => r.status === status);
    return rows;
  }

  getLeaveRequest(id: string) {
    return this.leaveRequests.find((r) => r.id === id) ?? null;
  }

  createLeaveRequest(input: Partial<LeaveRequest>): LeaveRequest {
    const req: LeaveRequest = {
      id: `leave_${Math.random().toString(36).slice(2, 8)}`,
      employeeId: input.employeeId ?? "emp_001",
      employeeName: input.employeeName ?? "Unknown",
      department: input.department ?? "—",
      type: input.type ?? "annual",
      fromDate: input.fromDate ?? isoDay(new Date()),
      toDate: input.toDate ?? isoDay(new Date()),
      days: input.days ?? 1,
      reason: input.reason ?? "",
      status: "pending",
      submittedAt: new Date().toISOString(),
      decidedAt: null,
      decidedBy: null,
      decisionNote: null,
    };
    this.leaveRequests.unshift(req);
    return req;
  }

  decideLeaveRequest(id: string, decision: "approved" | "rejected", note?: string): LeaveRequest | null {
    const req = this.getLeaveRequest(id);
    if (!req) return null;
    req.status = decision;
    req.decidedAt = new Date().toISOString();
    req.decidedBy = "Maya Okafor";
    req.decisionNote = note ?? null;

    if (decision === "approved") {
      const start = new Date(req.fromDate);
      const end = new Date(req.toDate);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateISO = isoDay(d);
        const existing = this.attendance.find(
          (r) => r.employeeId === req.employeeId && r.date === dateISO,
        );
        if (existing) {
          existing.status = "on_leave";
          existing.clockIn = null;
          existing.clockOut = null;
          existing.durationMinutes = null;
        }
      }
      const emp = this.getEmployee(req.employeeId);
      if (emp && emp.status === "active") emp.status = "on_leave";
    }
    return req;
  }
}

// Global singleton — survives client-side navigation.
const globalForDb = globalThis as unknown as { __shifttrackDb?: MockDatabase };
export const db = globalForDb.__shifttrackDb ?? new MockDatabase();
globalForDb.__shifttrackDb = db;

export { isoDay };
