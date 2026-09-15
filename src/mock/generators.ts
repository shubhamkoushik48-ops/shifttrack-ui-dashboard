import { makeRng, seedFrom } from "@/lib/rng";
import { DEPARTMENTS, DESIGNATIONS, LOCATIONS } from "@/constants";
import type { Employee, Shift, AttendanceRecord, LeaveRequest } from "@/types";

// ── Name pools ──────────────────────────────────────────────────────────
const FIRST = [
  "Aarav", "Maya", "Liam", "Sofia", "Noah", "Elena", "Ethan", "Priya", "Marcus", "Aisha",
  "Daniel", "Grace", "Omar", "Nina", "Lucas", "Zara", "Felix", "Hana", "Jonas", "Keira",
  "Malik", "Iris", "Victor", "Chloe", "Samuel", "Leila", "Hugo", "Anika", "Tomas", "Yara",
  "Adrian", "Bella", "Caleb", "Dana", "Emre", "Freya", "Gavin", "Hazel", "Ivan", "Jade",
  "Kofi", "Lena", "Milo", "Nadia", "Oscar", "Paula", "Quinn", "Rosa", "Silas", "Tara",
];
const LAST = [
  "Sharma", "Okafor", "Kim", "Nguyen", "Petrov", "Alvarez", "Fischer", "Haddad", "O'Brien", "Sato",
  "Novak", "Meyer", "Costa", "Yilmaz", "Andersson", "Dubois", "Rossi", "Kowalski", "Silva", "Brown",
  "Garcia", "Larsen", "Muller", "Ivanov", "Tanaka", "Ali", "Weber", "Moreau", "Ibrahim", "Chen",
];

// ── Helpers ─────────────────────────────────────────────────────────────
function isoDay(d: Date): string {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function dateAt(base: Date, dayOffset: number, hour: number, minute: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, minute, 0, 0);
  return d;
}

function minutesBetween(a: Date, b: Date): number {
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / 60000));
}

// ── Employees ───────────────────────────────────────────────────────────
export function generateEmployees(count = 48): Employee[] {
  const rng = makeRng(424242);
  const employees: Employee[] = [];
  for (let i = 0; i < count; i++) {
    const first = rng.pick(FIRST);
    const last = rng.pick(LAST);
    const name = `${first} ${last}`;
    const dept = rng.pick(DEPARTMENTS);
    const designations = DESIGNATIONS[dept] ?? ["Specialist"];
    const statusRoll = rng.next();
    const status = statusRoll > 0.94 ? "inactive" : statusRoll > 0.9 ? "suspended" : "active";
    const joinDate = dateAt(new Date(), -rng.int(30, 1500), 10, 0);
    employees.push({
      id: `emp_${(i + 1).toString().padStart(3, "0")}`,
      employeeCode: `EMP-${(i + 1).toString().padStart(4, "0")}`,
      name,
      email: `${first.toLowerCase()}.${last.toLowerCase().replace(/[^a-z]/g, "")}${i}@shifttrack.io`,
      phone: `+1 (${rng.int(201, 989)}) ${rng.int(200, 999)}-${rng.int(1000, 9999)}`,
      department: dept,
      designation: rng.pick(designations),
      status,
      employmentType: rng.chance(0.72)
        ? "full_time"
        : rng.chance(0.5)
          ? "contract"
          : rng.chance(0.5)
            ? "part_time"
            : "intern",
      shiftId: null,
      joinDate: joinDate.toISOString(),
      location: rng.pick(LOCATIONS),
      avatarSeed: name,
      createdAt: joinDate.toISOString(),
    });
  }
  return employees;
}

// ── Shifts ──────────────────────────────────────────────────────────────
export function generateShifts(employees: Employee[]): Shift[] {
  const rng = makeRng(777);
  const departments = Array.from(new Set(employees.map((e) => e.department)));
  const shifts: Shift[] = [
    {
      id: "shift_001",
      name: "Morning Shift",
      startTime: "06:00",
      endTime: "14:00",
      department: "Support",
      color: "#2563EB",
      status: "active",
      assignedEmployeeIds: [],
      days: [1, 2, 3, 4, 5],
    },
    {
      id: "shift_002",
      name: "Core Hours",
      startTime: "09:00",
      endTime: "17:00",
      department: "Engineering",
      color: "#7C3AED",
      status: "active",
      assignedEmployeeIds: [],
      days: [1, 2, 3, 4, 5],
    },
    {
      id: "shift_003",
      name: "Evening Shift",
      startTime: "14:00",
      endTime: "22:00",
      department: "Sales",
      color: "#F59E0B",
      status: "active",
      assignedEmployeeIds: [],
      days: [1, 2, 3, 4, 5, 6],
    },
    {
      id: "shift_004",
      name: "Night Ops",
      startTime: "22:00",
      endTime: "06:00",
      department: "Support",
      color: "#0EA5E9",
      status: "active",
      assignedEmployeeIds: [],
      days: [0, 1, 2, 3, 4, 5, 6],
    },
    {
      id: "shift_005",
      name: "Weekend Crew",
      startTime: "10:00",
      endTime: "18:00",
      department: "Marketing",
      color: "#22C55E",
      status: "draft",
      assignedEmployeeIds: [],
      days: [0, 6],
    },
  ];

  // Distribute employees across shifts within matching departments.
  for (const emp of employees) {
    if (emp.status === "inactive") continue;
    const matching = shifts.filter((s) => s.department === emp.department);
    const pool = matching.length ? matching : shifts;
    const shift = rng.pick(pool);
    if (shift.assignedEmployeeIds.length < 16) {
      shift.assignedEmployeeIds.push(emp.id);
      emp.shiftId = shift.id;
    }
  }
  // Ensure every department with employees has coverage
  for (const dept of departments) {
    if (!shifts.some((s) => s.department === dept)) {
      shifts.push({
        id: `shift_${shifts.length + 1}`.padEnd(9, "0"),
        name: `${dept} Flex`,
        startTime: "08:30",
        endTime: "16:30",
        department: dept,
        color: "#64748B",
        status: "active",
        assignedEmployeeIds: employees.filter((e) => e.department === dept).slice(0, 12).map((e) => e.id),
        days: [1, 2, 3, 4, 5],
      });
    }
  }
  for (const s of shifts) {
    for (const empId of s.assignedEmployeeIds) {
      const emp = employees.find((e) => e.id === empId);
      if (emp) emp.shiftId = s.id;
    }
  }
  return shifts;
}

// ── Attendance ──────────────────────────────────────────────────────────
export function generateAttendance(employees: Employee[], daysBack = 45): AttendanceRecord[] {
  const records: AttendanceRecord[] = [];
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  for (let dOffset = -daysBack; dOffset <= 0; dOffset++) {
    const day = new Date(today);
    day.setDate(day.getDate() + dOffset);
    const dow = day.getDay();

    for (const emp of employees) {
      if (emp.status === "inactive") continue;

      const seed = seedFrom(`${emp.id}:${isoDay(day)}`);
      const rng = makeRng(seed);

      // Weekend behavior — most off, some remote workers clock in
      if ((dow === 0 || dow === 6) && !rng.chance(0.18)) continue;

      // Leave simulation: ~4% on leave
      if (rng.chance(0.04)) {
        records.push({
          id: `att_${emp.id}_${isoDay(day)}`,
          employeeId: emp.id,
          employeeName: emp.name,
          department: emp.department,
          date: isoDay(day),
          clockIn: null,
          clockOut: null,
          durationMinutes: null,
          status: "on_leave",
          method: "web",
        });
        continue;
      }

      // Absent simulation: ~3.5%
      if (rng.chance(0.035)) {
        records.push({
          id: `att_${emp.id}_${isoDay(day)}`,
          employeeId: emp.id,
          employeeName: emp.name,
          department: emp.department,
          date: isoDay(day),
          clockIn: null,
          clockOut: null,
          durationMinutes: null,
          status: "absent",
          method: "web",
        });
        continue;
      }

      const shift = null; // shift start derived below
      void shift;
      const baseHour = rng.chance(0.5) ? 9 : rng.chance(0.5) ? 8 : 10;
      const late = rng.chance(0.11);
      const inMinute = late ? rng.int(16, 75) : rng.int(-25, 12);
      const clockIn = new Date(day);
      clockIn.setHours(baseHour, Math.max(0, 30 + inMinute), 0, 0);

      const isToday = dOffset === 0;
      const stillWorking = isToday ? rng.chance(0.72) : rng.chance(0.04);
      const workMinutes = rng.int(6 * 60 + 40, 9 * 60 + 45);
      const clockOut = stillWorking ? null : new Date(clockIn.getTime() + workMinutes * 60000);

      records.push({
        id: `att_${emp.id}_${isoDay(day)}`,
        employeeId: emp.id,
        employeeName: emp.name,
        department: emp.department,
        date: isoDay(day),
        clockIn: clockIn.toISOString(),
        clockOut: clockOut ? clockOut.toISOString() : null,
        durationMinutes: clockOut ? minutesBetween(clockIn, clockOut) : null,
        status: late ? "late" : rng.chance(0.14) ? "remote" : "present",
        method: rng.chance(0.62) ? "web" : rng.chance(0.7) ? "mobile" : "kiosk",
        note: undefined,
      });
    }
  }
  return records;
}

// ── Leave requests ──────────────────────────────────────────────────────
const REASONS = [
  "Family wedding out of state",
  "Medical procedure and recovery",
  "Annual family vacation",
  "Moving to a new apartment",
  "Childcare emergency",
  "Personal matters requiring attention",
  "Conference attendance",
  "Rest and recovery after flu",
];

export function generateLeaveRequests(employees: Employee[]): LeaveRequest[] {
  const rng = makeRng(90210);
  const out: LeaveRequest[] = [];
  const active = employees.filter((e) => e.status === "active" || e.status === "suspended");
  const today = new Date();

  for (let i = 0; i < 26; i++) {
    const emp = rng.pick(active);
    const statusRoll = rng.next();
    const status = statusRoll < 0.42 ? "pending" : statusRoll < 0.82 ? "approved" : "rejected";
    const type = rng.pick(["annual", "sick", "casual", "unpaid", "parental"] as const);
    const days = rng.int(1, 6);
    const futureOffset = status === "pending" ? rng.int(1, 30) : rng.int(-45, 20);
    const fromDate = new Date(today);
    fromDate.setDate(fromDate.getDate() + futureOffset);
    const toDate = new Date(fromDate);
    toDate.setDate(toDate.getDate() + days - 1);
    const submittedAt = new Date(fromDate);
    submittedAt.setDate(submittedAt.getDate() - rng.int(2, 14));
    submittedAt.setHours(rng.int(8, 19), rng.int(0, 59), 0, 0);

    const decidedAt = status === "pending" ? null : new Date(submittedAt.getTime() + rng.int(4, 60) * 3600000);

    out.push({
      id: `leave_${(i + 1).toString().padStart(3, "0")}`,
      employeeId: emp.id,
      employeeName: emp.name,
      department: emp.department,
      type,
      fromDate: isoDay(fromDate),
      toDate: isoDay(toDate),
      days,
      reason: rng.pick(REASONS),
      status,
      submittedAt: submittedAt.toISOString(),
      decidedAt: decidedAt ? decidedAt.toISOString() : null,
      decidedBy: decidedAt ? "Maya Okafor" : null,
      decisionNote: decidedAt ? (status === "approved" ? "Coverage confirmed." : "Team capacity is tight that week.") : null,
    });
  }
  return out.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
}

export { isoDay, dateAt };
