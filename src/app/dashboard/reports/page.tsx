"use client";

import { useState } from "react";
import {
  BarChart3,
  CalendarDays,
  CalendarRange,
  Clock,
  FileSpreadsheet,
  FileText,
  Percent,
  PlaneTakeoff,
  Sheet,
  TrendingUp,
  Trophy,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton, EmptyState } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/separator";
import { AttendanceTrendChart, UtilizationBarChart } from "@/components/dashboard/charts";
import { useReport } from "@/hooks/use-queries";
import { exportCSV, exportExcel, exportPDF, type ExportColumn } from "@/lib/export";
import { cn, pct } from "@/lib/utils";

type Range = "daily" | "weekly" | "monthly";

const COLUMNS: ExportColumn[] = [
  { key: "employeeName", header: "Employee" },
  { key: "department", header: "Department" },
  { key: "presentDays", header: "Present Days" },
  { key: "rate", header: "Attendance %" },
];

export default function ReportsPage() {
  const [range, setRange] = useState<Range>("weekly");
  const { data, isLoading, isError, refetch } = useReport(range);

  const summary = data;

  const handleExport = (kind: "csv" | "excel" | "pdf") => {
    if (!summary) return;
    const rows = summary.topAttendees.map((t) => ({ ...t }));
    const filename = `shifttrack-${range}-report`;
    if (rows.length === 0) {
      toast.error("Nothing to export yet");
      return;
    }
    if (kind === "csv") exportCSV(rows, COLUMNS, filename);
    if (kind === "excel") exportExcel(rows, COLUMNS, filename);
    if (kind === "pdf") {
      exportPDF(
        `${summary.label} Report`,
        `${summary.range} · Attendance ${summary.attendanceRate}% · ${summary.totalHours}h logged`,
        rows,
        COLUMNS,
        filename,
      );
    }
    toast.success(`${kind.toUpperCase()} export downloaded`);
  };

  const metrics = [
    { label: "Attendance rate", value: `${summary?.attendanceRate ?? 0}%`, icon: Percent, tone: "text-primary bg-primary/10" },
    { label: "Total hours", value: `${summary?.totalHours ?? 0}h`, icon: Clock, tone: "text-info bg-info/10" },
    { label: "Overtime", value: `${summary?.overtimeHours ?? 0}h`, icon: TrendingUp, tone: "text-success bg-success/10" },
    { label: "Late arrivals", value: summary?.lateArrivals ?? 0, icon: Clock, tone: "text-warning bg-warning/10" },
    { label: "Absences", value: summary?.absentDays ?? 0, icon: Users, tone: "text-destructive bg-destructive/10" },
    { label: "Leave days", value: summary?.leaveDaysTaken ?? 0, icon: PlaneTakeoff, tone: "text-info bg-info/10" },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Reports"
        description="Analytics across attendance, leave and shift utilization."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => handleExport("csv")}>
              <FileText /> CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExport("excel")}>
              <FileSpreadsheet /> Excel
            </Button>
            <Button variant="gradient" size="sm" onClick={() => handleExport("pdf")}>
              <FileText /> PDF
            </Button>
          </>
        }
      />

      {/* Range switcher */}
      <div className="flex items-center justify-between">
        <div className="flex rounded-lg border bg-muted/40 p-0.5">
          {(["daily", "weekly", "monthly"] as Range[]).map((r) => {
            const Icon = r === "daily" ? CalendarDays : r === "weekly" ? CalendarRange : BarChart3;
            return (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-4 py-1.5 text-xs font-medium capitalize transition-colors",
                  range === r ? "bg-card shadow-sm" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="h-3.5 w-3.5" /> {r}
              </button>
            );
          })}
        </div>
        {summary && (
          <p className="hidden text-xs text-muted-foreground sm:block">
            {summary.label} · <span className="tabular">{summary.range}</span>
          </p>
        )}
      </div>

      {isError ? (
        <Card>
          <ErrorState onRetry={() => void refetch()} />
        </Card>
      ) : isLoading || !summary ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-[300px] rounded-xl" />
          <Skeleton className="h-[300px] rounded-xl" />
        </div>
      ) : (
        <>
          {/* Metric strip */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {metrics.map((m) => (
              <Card key={m.label} className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[11px] text-muted-foreground">{m.label}</p>
                    <p className="mt-1 font-display text-xl font-bold tabular">{m.value}</p>
                  </div>
                  <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg", m.tone)}>
                    <m.icon className="h-4 w-4" />
                  </span>
                </div>
              </Card>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Attendance Trends</CardTitle>
                <CardDescription>Present vs late across the period</CardDescription>
              </CardHeader>
              <CardContent>
                <AttendanceTrendChart data={summary.trend} height={260} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Shift Utilization</CardTitle>
                <CardDescription>Assigned capacity per shift</CardDescription>
              </CardHeader>
              <CardContent>
                {summary.shiftUtilizationBars.length === 0 ? (
                  <EmptyState title="No active shifts" />
                ) : (
                  <UtilizationBarChart data={summary.shiftUtilizationBars} height={260} />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Leave trend + utilization summary */}
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <Card className="xl:col-span-1">
              <CardHeader>
                <CardTitle>Leave Trends</CardTitle>
                <CardDescription>Approved leave days by type</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3.5">
                {summary.leaveTrend.map((row) => {
                  const total = summary.leaveTrend.reduce((s, r) => s + r.annual + r.sick + r.casual + r.unpaid, 0);
                  const value = row.annual + row.sick + row.casual + row.unpaid;
                  const colors: Record<string, string> = {
                    Annual: "bg-primary",
                    Sick: "bg-destructive",
                    Casual: "bg-info",
                    Unpaid: "bg-muted-foreground",
                  };
                  return (
                    <div key={row.label}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="font-medium">{row.label}</span>
                        <span className="tabular text-muted-foreground">
                          {value}d · {pct(value, total)}%
                        </span>
                      </div>
                      <Progress value={pct(value, total)} indicatorClassName={colors[row.label] ?? "bg-primary"} />
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Utilization Summary</CardTitle>
                <CardDescription>Overall shift coverage efficiency</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <div className="relative flex h-36 w-36 items-center justify-center">
                  <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="52" fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
                    <circle
                      cx="60"
                      cy="60"
                      r="52"
                      fill="none"
                      stroke="#2563EB"
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray={`${(summary.shiftUtilization / 100) * 326.7} 326.7`}
                    />
                  </svg>
                  <div className="absolute text-center">
                    <p className="font-display text-3xl font-bold tabular">{summary.shiftUtilization}%</p>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Utilization</p>
                  </div>
                </div>
                <p className="mt-4 text-center text-xs text-muted-foreground">
                  Average across all active shifts
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-warning" /> Top Attendees
                </CardTitle>
                <CardDescription>Highest attendance this period</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {summary.topAttendees.map((t, i) => (
                    <div key={t.employeeName} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted/50">
                      <span
                        className={cn(
                          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                          i === 0
                            ? "bg-warning/15 text-warning"
                            : i === 1
                              ? "bg-muted text-muted-foreground"
                              : i === 2
                                ? "bg-orange-500/15 text-orange-600"
                                : "bg-muted text-muted-foreground",
                        )}
                      >
                        #{i + 1}
                      </span>
                      <Avatar name={t.employeeName} className="h-7 w-7" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-medium">{t.employeeName}</p>
                        <p className="text-[11px] text-muted-foreground">{t.department}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold tabular">{t.rate}%</p>
                        <p className="text-[10px] text-muted-foreground">{t.presentDays}d present</p>
                      </div>
                    </div>
                  ))}
                  {summary.topAttendees.length === 0 && <EmptyState title="No attendance data" />}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
