"use client";

import { useEffect, useState } from "react";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import { X, Mail, Phone, MapPin, CalendarDays, Timer, BadgeCheck, Pencil } from "lucide-react";
import { format } from "date-fns";
import { Dialog } from "@/components/ui/dialog";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/dashboard/attendance-status-badge";
import { useAttendance } from "@/hooks/use-queries";
import { employeeService } from "@/services";
import { formatDuration, formatTime } from "@/lib/utils";
import { EMPLOYMENT_TYPE_LABELS } from "@/constants";
import type { Employee } from "@/types";

interface Props {
  employee: Employee | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (employee: Employee) => void;
  onDeactivate: (employee: Employee) => void;
}

function InfoRow({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-2">
      <span className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="truncate text-[13px] font-medium">{value}</p>
      </div>
    </div>
  );
}

export function EmployeeProfileDrawer({ employee, open, onOpenChange, onEdit, onDeactivate }: Props) {
  const [shiftName, setShiftName] = useState<string | null>(null);
  const today = format(new Date(), "yyyy-MM-dd");
  const { data: attendance, isLoading } = useAttendance({ date: today });

  useEffect(() => {
    let cancelled = false;
    if (employee?.shiftId) {
      import("@/services").then(({ shiftService }) =>
        shiftService.list().then((rows) => {
          if (!cancelled) setShiftName(rows.find((s) => s.id === employee.shiftId)?.name ?? null);
        }),
      );
    } else {
      setShiftName(null);
    }
    return () => {
      cancelled = true;
    };
  }, [employee?.shiftId]);

  if (!employee) return null;

  const myRecords = (attendance?.data ?? [])
    .filter((r) => r.employeeId === employee.id)
    .slice(0, 1);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <SheetPrimitive.Overlay className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=open]:fade-in-0" />
      <SheetPrimitive.Content
        className="fixed right-0 top-0 z-50 h-full w-full max-w-md overflow-y-auto border-l bg-background p-6 shadow-2xl duration-300 data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:animate-in data-[state=open]:slide-in-from-right sm:max-w-[440px]"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <SheetPrimitive.Close className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
          <X className="h-4 w-4" />
        </SheetPrimitive.Close>

        <div className="flex items-start gap-4 pt-2">
          <Avatar name={employee.name} className="h-14 w-14 text-lg" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="truncate font-display text-lg font-bold">{employee.name}</h2>
              <StatusBadge status={employee.status} />
            </div>
            <p className="text-sm text-muted-foreground">
              {employee.designation} · {employee.department}
            </p>
            <p className="mt-0.5 text-xs font-medium text-primary">{employee.employeeCode}</p>
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={() => onEdit(employee)}>
            <Pencil /> Edit profile
          </Button>
          {employee.status !== "inactive" && (
            <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => onDeactivate(employee)}>
              Deactivate
            </Button>
          )}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-2">
          <div className="rounded-xl border bg-card p-3">
            <p className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
              <Timer className="h-3 w-3" /> Shift
            </p>
            <p className="mt-1 text-[13px] font-semibold">{shiftName ?? "Unassigned"}</p>
          </div>
          <div className="rounded-xl border bg-card p-3">
            <p className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
              <BadgeCheck className="h-3 w-3" /> Type
            </p>
            <p className="mt-1 text-[13px] font-semibold">{EMPLOYMENT_TYPE_LABELS[employee.employmentType]}</p>
          </div>
        </div>

        <div className="mt-6">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Contact</p>
          <div className="rounded-xl border bg-card px-4 py-2">
            <InfoRow icon={Mail} label="Email" value={employee.email} />
            <InfoRow icon={Phone} label="Phone" value={employee.phone} />
            <InfoRow icon={MapPin} label="Location" value={employee.location} />
            <InfoRow
              icon={CalendarDays}
              label="Joined"
              value={new Date(employee.joinDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            />
          </div>
        </div>

        <div className="mt-6">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Today's attendance</p>
          <div className="rounded-xl border bg-card p-4">
            {isLoading ? (
              <Skeleton className="h-12 w-full" />
            ) : myRecords.length === 0 ? (
              <p className="text-xs text-muted-foreground">No attendance record for today yet.</p>
            ) : (
              myRecords.map((r) => (
                <div key={r.id} className="flex items-center justify-between">
                  <div>
                    <StatusBadge status={r.status} />
                    <p className="mt-1.5 text-[11px] text-muted-foreground">
                      In {r.clockIn ? formatTime(r.clockIn) : "—"} · Out {r.clockOut ? formatTime(r.clockOut) : "—"}
                    </p>
                  </div>
                  <p className="font-display text-lg font-bold tabular">{formatDuration(r.durationMinutes ?? 0)}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <p className="mt-6 text-center text-[10px] text-muted-foreground">
          Employee since {format(new Date(employee.createdAt), "MMM yyyy")} · ID {employee.id}
        </p>
      </SheetPrimitive.Content>
    </Dialog>
  );
}

