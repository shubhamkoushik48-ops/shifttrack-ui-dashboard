import { db, isoDay } from "./db";
import { accounts } from "./accounts";
import { ApiError } from "./api-error";
import {
  buildDashboardStats,
  buildCurrentlyClockedIn,
  buildRecentActivities,
  buildPendingApprovals,
  buildUpcomingShifts,
  buildOverviewSnapshot,
  buildReportSummary,
  buildDepartmentDistribution,
} from "./aggregates";
import { makeRng, seedFrom } from "@/lib/rng";
import type { AttendanceRecord, Employee, LeaveRequest, Paginated, Shift } from "@/types";

export type MockHandler = (url: string, body?: unknown, method?: string) => unknown;

function latency(rngSeed: string): Promise<void> {
  const rng = makeRng(seedFrom(rngSeed));
  const ms = 120 + Math.floor(rng.next() * 380);
  return new Promise((res) => setTimeout(res, ms));
}

function paginate<T>(rows: T[], url: URL): Paginated<T> {
  const page = Number(url.searchParams.get("page") ?? 1);
  const pageSize = Number(url.searchParams.get("pageSize") ?? 10);
  const total = rows.length;
  return {
    data: rows.slice((page - 1) * pageSize, page * pageSize),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

/**
 * Simulated backend. Mirrors the REST contract described in src/services.
 * Each call resolves after human-feeling latency with fresh data.
 */
export async function mockRequest<T>(
  method: "GET" | "POST" | "PATCH" | "DELETE",
  url: string,
  body?: unknown,
): Promise<T> {
  await latency(`${method}:${url}`);
  const parsed = new URL(url, "http://mock.shifttrack.local");
  const path = parsed.pathname;
  const q = parsed.searchParams;

  // ── Auth ─────────────────────────────────────────────────────────────
  if (path === "/auth/login" && method === "POST") {
    const { email, password } = (body ?? {}) as { email?: string; password?: string };
    const normalized = (email ?? "").trim().toLowerCase();
    const account = accounts.findByEmail(normalized);

    // Registered accounts must present the password they signed up with.
    if (account && account.password !== password) {
      throw new ApiError("Incorrect password for this account.", 401);
    }
    // Unknown account or the built-in demo manager — sign straight in.
    const name = account ? account.name : "Maya Okafor";
    const role = account ? account.role : "manager";
    const department = account ? account.department : "Operations";

    return {
      user: {
        id: account ? account.id : "usr_001",
        name,
        email: normalized || "manager@shifttrack.io",
        role,
        department,
      },
      accessToken: `mock.jwt.${Math.random().toString(36).slice(2)}`,
      expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 7,
    } as T;
  }

  if (path === "/auth/register" && method === "POST") {
    const { name, email, password, department } = (body ?? {}) as {
      name?: string;
      email?: string;
      password?: string;
      department?: string;
    };
    const normalized = (email ?? "").trim().toLowerCase();

    if (!name || !normalized || !password) {
      throw new ApiError("Name, email and password are required.", 400);
    }
    if (accounts.findByEmail(normalized)) {
      throw new ApiError(
        "An account with this email already exists. Try signing in instead.",
        409,
      );
    }

    const account = accounts.create({ name, email: normalized, password, department });

    return {
      user: {
        id: account.id,
        name: account.name,
        email: account.email,
        role: account.role,
        department: account.department,
      },
      accessToken: `mock.jwt.${Math.random().toString(36).slice(2)}`,
      expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 7,
    } as T;
  }

  // ── Dashboard / aggregates ───────────────────────────────────────────
  if (path === "/dashboard/overview") return buildOverviewSnapshot() as T;
  if (path === "/dashboard/stats") return buildDashboardStats() as T;
  if (path === "/dashboard/clocked-in") return buildCurrentlyClockedIn() as T;
  if (path === "/dashboard/activities") return buildRecentActivities() as T;
  if (path === "/dashboard/pending-approvals") return buildPendingApprovals() as T;
  if (path === "/dashboard/upcoming-shifts") return buildUpcomingShifts() as T;
  if (path === "/dashboard/departments") return buildDepartmentDistribution() as T;

  // ── Reports ──────────────────────────────────────────────────────────
  if (path === "/reports/summary") {
    const range = (q.get("range") ?? "weekly") as "daily" | "weekly" | "monthly";
    return buildReportSummary(range) as T;
  }

  // ── Employees ────────────────────────────────────────────────────────
  if (path === "/employees" && method === "GET") {
    const rows = db.listEmployees({
      page: Number(q.get("page") ?? 1),
      pageSize: Number(q.get("pageSize") ?? 10),
      search: q.get("search") ?? "",
      department: q.get("department") ?? "all",
      status: q.get("status") ?? "all",
      sortBy: q.get("sortBy") ?? "name",
      sortDir: (q.get("sortDir") as "asc" | "desc") ?? "asc",
    });
    return rows as T;
  }
  if (path === "/employees" && method === "POST") {
    return db.createEmployee(body as Partial<Employee>) as T;
  }
  const empMatch = path.match(/^\/employees\/([^/]+)$/);
  if (empMatch) {
    const id = empMatch[1]!;
    if (method === "GET") {
      const emp = db.getEmployee(id);
      if (!emp) throw new Error("Employee not found");
      return emp as T;
    }
    if (method === "PATCH") return db.updateEmployee(id, body as Partial<Employee>) as T;
    if (method === "DELETE") return { ok: db.deleteEmployee(id) } as T;
  }
  if (path === "/employees/options") {
    return db.employees.map((e) => ({ id: e.id, name: e.name, department: e.department, shiftId: e.shiftId })) as T;
  }

  // ── Shifts ───────────────────────────────────────────────────────────
  if (path === "/shifts" && method === "GET") return db.listShifts() as T;
  if (path === "/shifts" && method === "POST") return db.createShift(body as Partial<Shift>) as T;
  const shiftMatch = path.match(/^\/shifts\/([^/]+)$/);
  if (shiftMatch) {
    const id = shiftMatch[1]!;
    if (method === "GET") {
      const s = db.getShift(id);
      if (!s) throw new Error("Shift not found");
      return s as T;
    }
    if (method === "PATCH") return db.updateShift(id, body as Partial<Shift>) as T;
    if (method === "DELETE") return { ok: db.deleteShift(id) } as T;
  }

  // ── Attendance ───────────────────────────────────────────────────────
  if (path === "/attendance" && method === "GET") {
    const date = q.get("date") ?? isoDay(new Date());
    const days = Number(q.get("days") ?? 1);
    let rows: AttendanceRecord[];
    if (days > 1) {
      const start = new Date(date);
      start.setDate(start.getDate() - (days - 1));
      rows = db.listAttendanceRange(isoDay(start), date);
    } else {
      rows = db.listAttendance({ date });
    }
    const status = q.get("status");
    if (status && status !== "all") rows = rows.filter((r) => r.status === status);
    const employeeId = q.get("employeeId");
    if (employeeId) rows = rows.filter((r) => r.employeeId === employeeId);
    rows = [...rows].sort((a, b) => a.employeeName.localeCompare(b.employeeName));
    return { data: rows, total: rows.length } as T;
  }
  if (path === "/attendance/clock-in" && method === "POST") {
    const { employeeId } = (body ?? {}) as { employeeId: string };
    return db.clockIn(employeeId) as T;
  }
  if (path === "/attendance/clock-out" && method === "POST") {
    const { employeeId } = (body ?? {}) as { employeeId: string };
    const rec = db.clockOut(employeeId);
    if (!rec) throw new Error("No open clock-in found");
    return rec as T;
  }

  // ── Leave ────────────────────────────────────────────────────────────
  if (path === "/leave-requests" && method === "GET") {
    const status = q.get("status") ?? "all";
    const rows = db.listLeaveRequests(status);
    return rows as T;
  }
  if (path === "/leave-requests" && method === "POST") {
    return db.createLeaveRequest(body as Partial<LeaveRequest>) as T;
  }
  const leaveMatch = path.match(/^\/leave-requests\/([^/]+)\/(approve|reject)$/);
  if (leaveMatch && method === "POST") {
    const [, id, action] = leaveMatch;
    const note = (body as { note?: string })?.note;
    return db.decideLeaveRequest(id!, action === "approve" ? "approved" : "rejected", note) as T;
  }
  const leaveGetMatch = path.match(/^\/leave-requests\/([^/]+)$/);
  if (leaveGetMatch && method === "GET") {
    const req = db.getLeaveRequest(leaveGetMatch[1]!);
    if (!req) throw new Error("Leave request not found");
    return req as T;
  }

  // ── Business locations & presence ────────────────────────────────────
  if (path === "/locations" && method === "GET") {
    return db.listLocations() as T;
  }
  if (path === "/locations" && method === "POST") {
    return db.createLocation(body as never) as T;
  }
  const locMatch = path.match(/^\/locations\/([^/]+)$/);
  if (locMatch) {
    const id = locMatch[1]!;
    if (method === "GET") {
      const loc = db.getLocation(id);
      if (!loc) throw new Error("Location not found");
      return loc as T;
    }
    if (method === "PATCH") return db.updateLocation(id, body as never) as T;
    if (method === "DELETE") return { ok: db.deleteLocation(id) } as T;
  }
  if (path === "/presence" && method === "GET") {
    const locationId = q.get("locationId") ?? undefined;
    return db.listPresence(locationId && locationId !== "all" ? locationId : undefined) as T;
  }
  const presenceToggle = path.match(/^\/presence\/([^/]+)\/sharing$/);
  if (presenceToggle && method === "PATCH") {
    const { enabled } = (body ?? {}) as { enabled?: boolean };
    const p = db.updatePresence(presenceToggle[1]!, {
      sharingEnabled: enabled ?? false,
      lastPingAt: new Date().toISOString(),
    });
    if (!p) throw new Error("Presence not found");
    return p as T;
  }

  throw new Error(`No mock handler for ${method} ${path}`);
}
