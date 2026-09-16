import { http } from "@/lib/api-client";
import type {
  BusinessLocation,
  BusinessLocationInput,
  Employee,
  EmployeePresence,
  LeaveRequest,
  AttendanceRecord,
  AuthSession,
  CurrentlyClockedIn,
  DashboardStats,
  OverviewSnapshot,
  Paginated,
  RecentActivity,
  ReportSummary,
  Shift,
  UpcomingShift,
} from "@/types";

/**
 * Service layer — one object per domain. All calls flow through the axios
 * client, so swapping the mock adapter for a real backend changes nothing.
 */

export const authService = {
  async login(email: string, password: string): Promise<AuthSession> {
    const res = await http.post<AuthSession>("/auth/login", { email, password });
    return res.data;
  },
  async register(input: {
    name: string;
    email: string;
    password: string;
    department?: string;
  }): Promise<AuthSession> {
    const res = await http.post<AuthSession>("/auth/register", input);
    return res.data;
  },
  /** Simulated OAuth handshake — a real backend would redirect to the provider. */
  async socialLogin(provider: "google" | "facebook" | "twitter", email: string): Promise<AuthSession> {
    const res = await http.post<AuthSession>("/auth/login/social", { provider, email });
    return res.data;
  },
  async logout(): Promise<void> {
    await http.post("/auth/logout");
  },
};

export const dashboardService = {
  async overview(): Promise<OverviewSnapshot> {
    const res = await http.get<OverviewSnapshot>("/dashboard/overview");
    return res.data;
  },
  async stats(): Promise<DashboardStats> {
    const res = await http.get<DashboardStats>("/dashboard/stats");
    return res.data;
  },
  async clockedIn(): Promise<CurrentlyClockedIn[]> {
    const res = await http.get<CurrentlyClockedIn[]>("/dashboard/clocked-in");
    return res.data;
  },
  async activities(): Promise<RecentActivity[]> {
    const res = await http.get<RecentActivity[]>("/dashboard/activities");
    return res.data;
  },
  async upcomingShifts(): Promise<UpcomingShift[]> {
    const res = await http.get<UpcomingShift[]>("/dashboard/upcoming-shifts");
    return res.data;
  },
};

export interface EmployeeQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  department?: string;
  status?: string;
  sortBy?: string;
  sortDir?: "asc" | "desc";
}

export const employeeService = {
  async list(query: EmployeeQuery): Promise<Paginated<Employee>> {
    const res = await http.get<Paginated<Employee>>("/employees", { params: query });
    return res.data;
  },
  async get(id: string): Promise<Employee> {
    const res = await http.get<Employee>(`/employees/${id}`);
    return res.data;
  },
  async create(input: Partial<Employee>): Promise<Employee> {
    const res = await http.post<Employee>("/employees", input);
    return res.data;
  },
  async update(id: string, patch: Partial<Employee>): Promise<Employee> {
    const res = await http.patch<Employee>(`/employees/${id}`, patch);
    return res.data;
  },
  async deactivate(id: string): Promise<{ ok: boolean }> {
    const res = await http.delete<{ ok: boolean }>(`/employees/${id}`);
    return res.data;
  },
};

export const shiftService = {
  async list(): Promise<Shift[]> {
    const res = await http.get<Shift[]>("/shifts");
    return res.data;
  },
  async create(input: Partial<Shift>): Promise<Shift> {
    const res = await http.post<Shift>("/shifts", input);
    return res.data;
  },
  async update(id: string, patch: Partial<Shift>): Promise<Shift> {
    const res = await http.patch<Shift>(`/shifts/${id}`, patch);
    return res.data;
  },
  async remove(id: string): Promise<{ ok: boolean }> {
    const res = await http.delete<{ ok: boolean }>(`/shifts/${id}`);
    return res.data;
  },
};

export interface AttendanceQuery {
  date?: string;
  days?: number;
  status?: string;
  employeeId?: string;
}

export const attendanceService = {
  async list(query: AttendanceQuery): Promise<{ data: AttendanceRecord[]; total: number }> {
    const res = await http.get<{ data: AttendanceRecord[]; total: number }>("/attendance", { params: query });
    return res.data;
  },
  async clockIn(employeeId: string): Promise<AttendanceRecord> {
    const res = await http.post<AttendanceRecord>("/attendance/clock-in", { employeeId });
    return res.data;
  },
  async clockOut(employeeId: string): Promise<AttendanceRecord> {
    const res = await http.post<AttendanceRecord>("/attendance/clock-out", { employeeId });
    return res.data;
  },
};

export const leaveService = {
  async list(status?: string): Promise<LeaveRequest[]> {
    const res = await http.get<LeaveRequest[]>("/leave-requests", { params: { status } });
    return res.data;
  },
  async get(id: string): Promise<LeaveRequest> {
    const res = await http.get<LeaveRequest>(`/leave-requests/${id}`);
    return res.data;
  },
  async decide(id: string, action: "approve" | "reject", note?: string): Promise<LeaveRequest> {
    const res = await http.post<LeaveRequest>(`/leave-requests/${id}/${action}`, { note });
    return res.data;
  },
};

export const locationService = {
  async list(): Promise<BusinessLocation[]> {
    const res = await http.get<BusinessLocation[]>("/locations");
    return res.data;
  },
  async create(input: Partial<BusinessLocationInput>): Promise<BusinessLocation> {
    const res = await http.post<BusinessLocation>("/locations", input);
    return res.data;
  },
  async update(id: string, patch: Partial<BusinessLocation>): Promise<BusinessLocation> {
    const res = await http.patch<BusinessLocation>(`/locations/${id}`, patch);
    return res.data;
  },
  async remove(id: string): Promise<{ ok: boolean }> {
    const res = await http.delete<{ ok: boolean }>(`/locations/${id}`);
    return res.data;
  },
};

export const presenceService = {
  async list(locationId?: string): Promise<EmployeePresence[]> {
    const res = await http.get<EmployeePresence[]>("/presence", { params: { locationId } });
    return res.data;
  },
  async setSharing(employeeId: string, enabled: boolean): Promise<EmployeePresence> {
    const res = await http.patch<EmployeePresence>(`/presence/${employeeId}/sharing`, { enabled });
    return res.data;
  },
};

export const reportService = {
  async summary(range: "daily" | "weekly" | "monthly"): Promise<ReportSummary> {
    const res = await http.get<ReportSummary>("/reports/summary", { params: { range } });
    return res.data;
  },
};
