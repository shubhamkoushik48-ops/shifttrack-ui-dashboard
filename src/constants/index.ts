import {
  LayoutDashboard,
  Users,
  CalendarClock,
  Fingerprint,
  PlaneTakeoff,
  BarChart3,
  type LucideIcon,
} from "lucide-react";

export const APP_NAME = "ShiftTrack";
export const APP_TAGLINE = "Workforce Operations";
export const APP_VERSION = "2.4.0";

// ── Navigation ──────────────────────────────────────────────────────────
export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: "leave" | "attendance";
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Overview", href: "/dashboard/overview", icon: LayoutDashboard },
  { label: "Employees", href: "/dashboard/employees", icon: Users },
  { label: "Shifts", href: "/dashboard/shifts", icon: CalendarClock },
  { label: "Attendance", href: "/dashboard/attendance", icon: Fingerprint, badge: "attendance" },
  { label: "Leave", href: "/dashboard/leave", icon: PlaneTakeoff, badge: "leave" },
  { label: "Reports", href: "/dashboard/reports", icon: BarChart3 },
];

// ── Master data ─────────────────────────────────────────────────────────
export const DEPARTMENTS = [
  "Engineering",
  "Design",
  "Marketing",
  "Sales",
  "Finance",
  "HR",
  "Support",
] as const;

export const DESIGNATIONS: Record<string, string[]> = {
  Engineering: [
    "Software Engineer",
    "Senior Software Engineer",
    "Staff Engineer",
    "QA Engineer",
    "SRE",
    "Engineering Manager",
  ],
  Design: ["Product Designer", "Senior Designer", "Design Lead"],
  Marketing: ["Content Strategist", "Growth Marketer", "Marketing Manager"],
  Sales: ["SDR", "Account Executive", "Sales Manager"],
  Finance: ["Financial Analyst", "Controller", "Finance Manager"],
  HR: ["HR Generalist", "Recruiter", "HR Manager"],
  Support: ["Support Specialist", "Support Lead"],
};

export const LOCATIONS = [
  "New York HQ",
  "Austin Office",
  "London Office",
  "Remote",
  "Berlin Office",
  "Singapore Office",
  "Toronto Office",
] as const;

export const EMPLOYEE_STATUS_OPTIONS = [
  { value: "active", label: "Active", tone: "success" },
  { value: "on_leave", label: "On Leave", tone: "info" },
  { value: "suspended", label: "Suspended", tone: "warning" },
  { value: "inactive", label: "Inactive", tone: "danger" },
] as const;

export const EMPLOYMENT_TYPES = [
  { value: "full_time", label: "Full-time" },
  { value: "part_time", label: "Part-time" },
  { value: "contract", label: "Contract" },
  { value: "intern", label: "Intern" },
] as const;

export const EMPLOYMENT_TYPE_LABELS: Record<string, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Contract",
  intern: "Intern",
};

export const LEAVE_TYPES = [
  { value: "annual", label: "Annual Leave", tone: "primary" },
  { value: "sick", label: "Sick Leave", tone: "danger" },
  { value: "casual", label: "Casual Leave", tone: "info" },
  { value: "unpaid", label: "Unpaid Leave", tone: "muted" },
  { value: "parental", label: "Parental Leave", tone: "success" },
] as const;

export const LEAVE_TYPE_LABELS: Record<string, string> = {
  annual: "Annual",
  sick: "Sick",
  casual: "Casual",
  unpaid: "Unpaid",
  parental: "Parental",
};

export const SHIFT_STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "draft", label: "Draft" },
  { value: "archived", label: "Archived" },
] as const;

export const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Toronto",
  "Europe/London",
  "Europe/Berlin",
  "Europe/Paris",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Asia/Kolkata",
  "Australia/Sydney",
  "UTC",
] as const;
