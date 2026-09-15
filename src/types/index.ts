// ── Shared ──────────────────────────────────────────────────────────────
export type ID = string;

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  [key: string]: unknown;
}

// ── Employees ───────────────────────────────────────────────────────────
export type EmployeeStatus = "active" | "on_leave" | "suspended" | "inactive";
export type EmploymentType = "full_time" | "part_time" | "contract" | "intern";

export interface Employee {
  id: ID;
  employeeCode: string; // EMP-0001
  name: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  status: EmployeeStatus;
  employmentType: EmploymentType;
  shiftId: ID | null;
  joinDate: string; // ISO
  location: string;
  avatarSeed: string;
  createdAt: string;
}

export interface EmployeeInput {
  name: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  status: EmployeeStatus;
  employmentType: EmploymentType;
  location: string;
}

// ── Shifts ──────────────────────────────────────────────────────────────
export type ShiftStatus = "active" | "draft" | "archived";

export interface Shift {
  id: ID;
  name: string;
  startTime: string; // "09:00"
  endTime: string; // "17:00"
  department: string;
  color: string; // hex accent
  status: ShiftStatus;
  assignedEmployeeIds: ID[];
  days: number[]; // 0=Sun … 6=Sat
}

export interface ShiftInput {
  name: string;
  startTime: string;
  endTime: string;
  department: string;
  status: ShiftStatus;
  color?: string;
  assignedEmployeeIds: ID[];
  days: number[];
}

// ── Attendance ──────────────────────────────────────────────────────────
export type AttendanceStatus = "present" | "late" | "absent" | "on_leave" | "remote";

export interface AttendanceRecord {
  id: ID;
  employeeId: ID;
  employeeName: string;
  department: string;
  date: string; // yyyy-MM-dd
  clockIn: string | null; // ISO
  clockOut: string | null; // ISO
  durationMinutes: number | null;
  status: AttendanceStatus;
  method: "web" | "mobile" | "kiosk";
  note?: string;
}

// ── Leave ───────────────────────────────────────────────────────────────
export type LeaveStatus = "pending" | "approved" | "rejected" | "cancelled";
export type LeaveType = "annual" | "sick" | "casual" | "unpaid" | "parental";

export interface LeaveRequest {
  id: ID;
  employeeId: ID;
  employeeName: string;
  department: string;
  type: LeaveType;
  fromDate: string; // yyyy-MM-dd
  toDate: string; // yyyy-MM-dd
  days: number;
  reason: string;
  status: LeaveStatus;
  submittedAt: string; // ISO
  decidedAt?: string | null;
  decidedBy?: string | null;
  decisionNote?: string | null;
}

export interface LeaveDecision {
  note?: string;
}

// ── Dashboard / Reports ─────────────────────────────────────────────────
export interface DashboardStats {
  totalEmployees: number;
  presentToday: number;
  absentToday: number;
  lateToday: number;
  onLeaveToday: number;
  pendingLeaveRequests: number;
  activeShifts: number;
  currentlyClockedIn: number;
  averageClockIn: string; // "09:12"
  attendanceRate: number; // %
  deltas: {
    totalEmployees: number;
    presentToday: number;
    absentToday: number;
    lateToday: number;
    pendingLeaveRequests: number;
    activeShifts: number;
  };
}

export interface CurrentlyClockedIn {
  employeeId: ID;
  employeeName: string;
  department: string;
  clockInAt: string; // ISO
  durationMinutes: number;
  status: AttendanceStatus;
}

export interface RecentActivity {
  id: ID;
  type: "clock_in" | "clock_out" | "leave_requested" | "leave_approved" | "leave_rejected" | "shift_assigned" | "employee_added";
  actor: string;
  message: string;
  at: string; // ISO
}

export interface UpcomingShift {
  id: ID;
  shiftName: string;
  department: string;
  startTime: string;
  endTime: string;
  assignedCount: number;
  date: string; // yyyy-MM-dd
  color: string;
}

export interface AttendanceTrendPoint {
  date: string; // label
  present: number;
  late: number;
  absent: number;
  onLeave: number;
}

export interface DepartmentDistribution {
  department: string;
  employees: number;
  present: number;
}

export interface PendingApproval {
  id: ID;
  employeeName: string;
  type: LeaveType;
  days: number;
  fromDate: string;
  toDate: string;
  submittedAt: string;
}

export interface ReportSummary {
  label: string; // "Daily", "Weekly", "Monthly"
  range: string;
  attendanceRate: number;
  totalHours: number;
  overtimeHours: number;
  lateArrivals: number;
  absentDays: number;
  leaveDaysTaken: number;
  shiftUtilization: number;
  trend: AttendanceTrendPoint[];
  leaveTrend: { label: string; annual: number; sick: number; casual: number; unpaid: number }[];
  shiftUtilizationBars: { shift: string; utilization: number; assigned: number; capacity: number }[];
  topAttendees: { employeeName: string; department: string; presentDays: number; rate: number }[];
}

export interface OverviewSnapshot {
  stats: DashboardStats;
  clockedIn: CurrentlyClockedIn[];
  activities: RecentActivity[];
  pendingApprovals: PendingApproval[];
  upcomingShifts: UpcomingShift[];
  weeklyTrend: AttendanceTrendPoint[];
  monthlyTrend: AttendanceTrendPoint[];
  departmentDistribution: DepartmentDistribution[];
}

// ── Realtime (Socket.IO contracts) ──────────────────────────────────────
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

export interface RealtimeStatus {
  connected: boolean;
  connecting: boolean;
  reconnectAttempt: number;
  lastEventAt: string | null;
  latencyMs: number | null;
}

// ── Notifications ───────────────────────────────────────────────────────
export interface AppNotification {
  id: ID;
  title: string;
  body: string;
  at: string;
  read: boolean;
  tone: "info" | "success" | "warning" | "danger";
}

// ── Auth ────────────────────────────────────────────────────────────────
export interface AuthUser {
  id: ID;
  name: string;
  email: string;
  role: "manager" | "admin";
  department: string;
}

export interface AuthSession {
  user: AuthUser;
  accessToken: string;
  expiresAt: number; // epoch ms
}
