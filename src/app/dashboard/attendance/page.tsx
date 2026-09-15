"use client";

import { useMemo, useState } from "react";
import {
  CalendarDays,
  CalendarRange,
  CalendarCheck,
  Fingerprint,
  Radio,
  UserCheck,
  UserX,
  Clock,
  PlaneTakeoff,
  Download,
} from "lucide-react";
import { format, subDays } from "date-fns";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton, EmptyState } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/dashboard/attendance-status-badge";
import { useAttendance, useClockInOut } from "@/hooks/use-queries";
import { useAttendanceStore } from "@/store/domain-store";
import { cn, formatDuration, formatTime } from "@/lib/utils";
import type { AttendanceRecord } from "@/types";

type RangeMode = "daily" | "weekly" | "monthly";

const RANGE_DAYS: Record<RangeMode, number> = { daily: 1, weekly: 7, monthly: 30 };

export default function AttendancePage() {
  const [mode, setMode] = useState<RangeMode>("daily");
  const [dateOffset, setDateOffset] = useState(0); // days back from today
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const liveRecords = useAttendanceStore((s) => s.records);
  const { clockIn, clockOut } = useClockInOut();

  const baseDate = useMemo(() => {
    const d = subDays(new Date(), dateOffset);
    return format(d, "yyyy-MM-dd");
  }, [dateOffset]);

  const { data, isLoading, isError, refetch } = useAttendance({
    date: baseDate,
    days: RANGE_DAYS[mode],
    status: statusFilter,
  });

  const rows = useMemo(() => {
    const fetched = data?.data ?? [];
    // Merge live store updates on top of fetched data
    const merged = fetched.map((r) => liveRecords.get(r.id) ?? r);
    const extra = Array.from(liveRecords.values()).filter(
      (r) => !merged.some((m) => m.id === r.id) && r.date >= (mode === "daily" ? baseDate : subDays(new Date(baseDate), RANGE_DAYS[mode] - 1).toISOString().slice(0, 10)),
    );
    const all = [...merged, ...extra];
    const filtered = search
      ? all.filter((r) => r.employeeName.toLowerCase().includes(search.toLowerCase()))
      : all;
    return filtered.sort((a, b) => a.employeeName.localeCompare(b.employeeName));
  }, [data, liveRecords, search, baseDate, mode]);

  const counts = useMemo(() => {
    const present = rows.filter((r) => r.status === "present" || r.status === "remote").length;
    const late = rows.filter((r) => r.status === "late").length;
    const absent = rows.filter((r) => r.status === "absent").length;
    const onLeave = rows.filter((r) => r.status === "on_leave").length;
    return { present, late, absent, onLeave };
  }, [rows]);

  const liveCount = rows.filter((r) => r.clockIn && !r.clockOut).length;

  const handleExport = () => {
    const csv = [
      "Employee,Department,Date,Clock In,Clock Out,Duration (min),Status,Method",
      ...rows.map((r) =>
        [
          r.employeeName,
          r.department,
          r.date,
          r.clockIn ? formatTime(r.clockIn) : "—",
          r.clockOut ? formatTime(r.clockOut) : "—",
          r.durationMinutes ?? "",
          r.status,
          r.method,
        ].join(","),
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance-${baseDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Attendance exported to CSV");
  };

  const kpiCards = [
    { label: "Present", value: counts.present, icon: UserCheck, tone: "text-success bg-success/10" },
    { label: "Late", value: counts.late, icon: Clock, tone: "text-warning bg-warning/10" },
    { label: "Absent", value: counts.absent, icon: UserX, tone: "text-destructive bg-destructive/10" },
    { label: "On Leave", value: counts.onLeave, icon: PlaneTakeoff, tone: "text-info bg-info/10" },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Attendance"
        description="Live clock-ins, session durations and daily records."
        actions={
          <>
            <Button variant="outline" onClick={handleExport}>
              <Download /> Export
            </Button>
            <Button
              variant="gradient"
              onClick={() => {
                // Demo: clock in the first available active employee
                const target = rows.find((r) => !r.clockIn && r.status !== "on_leave" && r.status !== "absent");
                if (!target) {
                  toast.info("Everyone possible is already clocked in");
                  return;
                }
                clockIn.mutate(target.employeeId);
              }}
            >
              <Fingerprint /> Simulate clock-in
            </Button>
          </>
        }
      />

      {/* Live banner */}
      <div className="flex items-center gap-3 rounded-xl border border-success/25 bg-success/[0.06] px-4 py-2.5">
        <Radio className="h-4 w-4 animate-pulse text-success" />
        <p className="text-[13px]">
          <span className="font-semibold">{liveCount} on the clock</span>
          <span className="text-muted-foreground"> — streaming in real time via Socket.IO</span>
        </p>
        <span className="ml-auto hidden items-center gap-1.5 text-[11px] text-muted-foreground sm:flex">
          <span className="relative flex h-2 w-2">
            <span className="absolute h-full w-full animate-ping rounded-full bg-success opacity-60" />
            <span className="relative h-2 w-2 rounded-full bg-success" />
          </span>
          Live
        </span>
      </div>

      {/* Status cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpiCards.map((k) => (
          <Card key={k.label} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{k.label}</p>
                <p className="mt-1 font-display text-2xl font-bold tabular">
                  {isLoading ? <span className="inline-block h-6 w-12 animate-pulse rounded bg-muted" /> : k.value}
                </p>
              </div>
              <span className={cn("flex h-9 w-9 items-center justify-center rounded-lg", k.tone)}>
                <k.icon className="h-4.5 w-4.5" />
              </span>
            </div>
          </Card>
        ))}
      </div>

      {/* Controls */}
      <Card className="p-4 sm:p-5">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex rounded-lg border bg-muted/40 p-0.5">
            {(["daily", "weekly", "monthly"] as RangeMode[]).map((m) => {
              const Icon = m === "daily" ? CalendarDays : m === "weekly" ? CalendarRange : CalendarCheck;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => { setMode(m); setDateOffset(0); }}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors",
                    mode === m ? "bg-card shadow-sm" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" /> {m}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center rounded-lg border bg-card">
              <Button variant="ghost" size="icon-sm" onClick={() => setDateOffset((d) => d + 1)} aria-label="Previous day">
                ‹
              </Button>
              <span className="min-w-[110px] text-center text-xs font-medium tabular">
                {mode === "daily"
                  ? format(new Date(baseDate), "EEE, MMM d yyyy")
                  : `${format(subDays(new Date(baseDate), RANGE_DAYS[mode] - 1), "MMM d")} – ${format(new Date(baseDate), "MMM d")}`}
              </span>
              <Button
                variant="ghost"
                size="icon-sm"
                disabled={dateOffset <= 0}
                onClick={() => setDateOffset((d) => d - 1)}
                aria-label="Next day"
              >
                ›
              </Button>
            </div>

            <div className="flex rounded-lg border bg-card p-0.5">
              {["all", "present", "late", "absent", "on_leave"].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatusFilter(s)}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-[11px] font-medium capitalize transition-colors",
                    statusFilter === s ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {s.replace("_", " ")}
                </button>
              ))}
            </div>

            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Find person…"
              className="h-8 w-full text-xs sm:w-40"
            />
          </div>
        </div>

        {isError ? (
          <ErrorState onRetry={() => void refetch()} />
        ) : rows.length === 0 && !isLoading ? (
          <EmptyState
            icon={<Fingerprint className="h-5 w-5" />}
            title="No attendance records"
            description="No one has clocked in for this period yet."
          />
        ) : isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-hidden rounded-lg border md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
                    <th className="px-4 py-2.5 text-left font-semibold">Employee</th>
                    <th className="px-4 py-2.5 text-left font-semibold">Clock In</th>
                    <th className="px-4 py-2.5 text-left font-semibold">Clock Out</th>
                    <th className="px-4 py-2.5 text-left font-semibold">Duration</th>
                    <th className="px-4 py-2.5 text-left font-semibold">Status</th>
                    <th className="px-4 py-2.5 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 50).map((r) => (
                    <tr key={r.id} className="border-b border-border/60 transition-colors last:border-0 hover:bg-muted/40">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={r.employeeName} className="h-7 w-7" />
                          <div>
                            <p className="text-[13px] font-medium">{r.employeeName}</p>
                            <p className="text-[10px] text-muted-foreground">{r.department}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-[13px] tabular">{r.clockIn ? formatTime(r.clockIn) : "—"}</td>
                      <td className="px-4 py-2.5 text-[13px] tabular">{r.clockOut ? formatTime(r.clockOut) : r.clockIn ? <Badge variant="success">On clock</Badge> : "—"}</td>
                      <td className="px-4 py-2.5 text-[13px] tabular">{formatDuration(r.durationMinutes ?? 0)}</td>
                      <td className="px-4 py-2.5"><StatusBadge status={r.status} /></td>
                      <td className="px-4 py-2.5 text-right">
                        {r.clockIn && !r.clockOut ? (
                          <Button variant="outline" size="sm" onClick={() => clockOut.mutate(r.employeeId)}>
                            Clock out
                          </Button>
                        ) : !r.clockIn && (r.status === "absent") ? (
                          <Button variant="outline" size="sm" onClick={() => clockIn.mutate(r.employeeId)}>
                            Clock in
                          </Button>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="space-y-2 md:hidden">
              {rows.slice(0, 30).map((r) => (
                <div key={r.id} className="rounded-xl border bg-card p-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={r.employeeName} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold">{r.employeeName}</p>
                      <p className="text-[11px] text-muted-foreground">{r.department}</p>
                    </div>
                    <StatusBadge status={r.status} />
                  </div>
                  <div className="mt-2.5 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg bg-muted/50 py-1.5">
                      <p className="text-[10px] text-muted-foreground">In</p>
                      <p className="text-xs font-semibold tabular">{r.clockIn ? formatTime(r.clockIn) : "—"}</p>
                    </div>
                    <div className="rounded-lg bg-muted/50 py-1.5">
                      <p className="text-[10px] text-muted-foreground">Out</p>
                      <p className="text-xs font-semibold tabular">{r.clockOut ? formatTime(r.clockOut) : "—"}</p>
                    </div>
                    <div className="rounded-lg bg-muted/50 py-1.5">
                      <p className="text-[10px] text-muted-foreground">Duration</p>
                      <p className="text-xs font-semibold tabular">{formatDuration(r.durationMinutes ?? 0)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
