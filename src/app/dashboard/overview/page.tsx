"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Clock,
  Coffee,
  Fingerprint,
  UserCheck,
  UserX,
  Users,
  PlaneTakeoff,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton, EmptyState } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/skeleton";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { AttendanceTrendChart, DepartmentDonut } from "@/components/dashboard/charts";
import { StatusBadge } from "@/components/dashboard/attendance-status-badge";
import { useOverview } from "@/hooks/use-queries";
import { formatTime, formatDuration, pct } from "@/lib/utils";
import { LEAVE_TYPE_LABELS } from "@/constants";

const ACTIVITY_ICONS = {
  clock_in: Fingerprint,
  clock_out: Clock,
  leave_requested: PlaneTakeoff,
  leave_approved: CheckCircle2,
  leave_rejected: UserX,
  shift_assigned: CalendarClock,
  employee_added: Users,
} as const;

export default function OverviewPage() {
  const { data, isLoading, isError, refetch } = useOverview();

  if (isError) {
    return (
      <div className="space-y-4">
        <PageHeader title="Overview" description="Your workforce at a glance." />
        <Card>
          <ErrorState onRetry={() => void refetch()} message="We couldn't load the dashboard. Check your connection and retry." />
        </Card>
      </div>
    );
  }

  const stats = data?.stats;
  const kpis = [
    {
      label: "Total Employees",
      value: stats?.totalEmployees ?? 0,
      icon: Users,
      tone: "primary" as const,
      delta: stats?.deltas.totalEmployees,
      href: "/dashboard/employees",
    },
    {
      label: "Present Today",
      value: stats?.presentToday ?? 0,
      icon: UserCheck,
      tone: "success" as const,
      delta: stats?.deltas.presentToday,
      href: "/dashboard/attendance",
    },
    {
      label: "Absent Today",
      value: stats?.absentToday ?? 0,
      icon: UserX,
      tone: "danger" as const,
      delta: stats?.deltas.absentToday,
      href: "/dashboard/attendance",
    },
    {
      label: "Late Arrivals",
      value: stats?.lateToday ?? 0,
      icon: Clock,
      tone: "warning" as const,
      delta: stats?.deltas.lateToday,
      href: "/dashboard/attendance",
    },
    {
      label: "Pending Leave",
      value: stats?.pendingLeaveRequests ?? 0,
      icon: PlaneTakeoff,
      tone: "info" as const,
      delta: stats?.deltas.pendingLeaveRequests,
      href: "/dashboard/leave",
    },
    {
      label: "Active Shifts",
      value: stats?.activeShifts ?? 0,
      icon: CalendarClock,
      tone: "primary" as const,
      delta: stats?.deltas.activeShifts,
      href: "/dashboard/shifts",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Good day, ${"Maya"}`}
        description={`Here's what's happening across your workforce — ${new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}.`}
        actions={
          <>
            <Button variant="outline" asChild>
              <Link href="/dashboard/reports">
                View reports <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
            <Button variant="gradient" asChild>
              <Link href="/dashboard/attendance">
                <Fingerprint /> Live attendance
              </Link>
            </Button>
          </>
        }
      />

      {/* KPI grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {kpis.map((k, i) => (
          <motion.div
            key={k.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Link href={k.href}>
              <KpiCard
                label={k.label}
                value={k.value}
                icon={k.icon}
                tone={k.tone}
                delta={k.delta}
                loading={isLoading}
              />
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="flex-row items-start justify-between space-y-0">
            <div>
              <CardTitle>Weekly Attendance Trend</CardTitle>
              <CardDescription>Present & late arrivals across the last 7 days</CardDescription>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#2563EB]" /> Present
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#F59E0B]" /> Late
              </span>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[280px] w-full" />
            ) : (
              <AttendanceTrendChart data={data?.weeklyTrend ?? []} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Employee Distribution</CardTitle>
            <CardDescription>Headcount by department</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[280px] w-full" />
            ) : (
              <DepartmentDonut data={data?.departmentDistribution ?? []} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Second charts + lists row */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {/* Currently clocked in */}
        <Card className="xl:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="flex items-center gap-2">
                Currently Clocked In
                <span className="relative flex h-2 w-2">
                  <span className="absolute h-full w-full animate-ping rounded-full bg-success opacity-60" />
                  <span className="relative h-2 w-2 rounded-full bg-success" />
                </span>
              </CardTitle>
              <CardDescription>
                {stats?.currentlyClockedIn ?? 0} people on the clock · avg. clock-in {stats?.averageClockIn ?? "—"}
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/attendance">
                Open live view <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-11 w-full" />
                ))}
              </div>
            ) : (data?.clockedIn.length ?? 0) === 0 ? (
              <EmptyState title="Nobody is clocked in" description="Clock-ins will appear here in real time." />
            ) : (
              <div className="space-y-1">
                {data?.clockedIn.slice(0, 6).map((row) => (
                  <div key={row.employeeId} className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted/50">
                    <Avatar name={row.employeeName} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium">{row.employeeName}</p>
                      <p className="text-[11px] text-muted-foreground">{row.department}</p>
                    </div>
                    <div className="hidden text-right sm:block">
                      <p className="text-[11px] text-muted-foreground">since {formatTime(row.clockInAt)}</p>
                    </div>
                    <Badge variant={row.status === "late" ? "warning" : "success"} className="tabular">
                      {formatDuration(row.durationMinutes)}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending approvals */}
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Pending Approvals</CardTitle>
              <CardDescription>Leave requests awaiting decision</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/leave">
                Review <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (data?.pendingApprovals.length ?? 0) === 0 ? (
              <EmptyState icon={<CheckCircle2 className="h-5 w-5" />} title="Queue is clear" description="No pending leave requests." />
            ) : (
              <div className="space-y-1">
                {data?.pendingApprovals.map((p) => (
                  <Link
                    key={p.id}
                    href="/dashboard/leave"
                    className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted/50"
                  >
                    <Avatar name={p.employeeName} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium">{p.employeeName}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {LEAVE_TYPE_LABELS[p.type]} · {p.days}d · from {new Date(p.fromDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </p>
                    </div>
                    <Badge variant="warning">{formatDistanceToNow(new Date(p.submittedAt), { addSuffix: true })}</Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Activity + upcoming shifts */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Live event stream across the workspace</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : (
              <div className="relative space-y-0.5">
                {data?.activities.map((a, i) => {
                  const Icon = ACTIVITY_ICONS[a.type] ?? Clock;
                  return (
                    <motion.div
                      key={a.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted/50"
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <p className="min-w-0 flex-1 truncate text-[13px]">
                        <span className="font-semibold">{a.actor}</span>{" "}
                        <span className="text-muted-foreground">{a.message}</span>
                      </p>
                      <span className="shrink-0 text-[11px] text-muted-foreground">
                        {formatDistanceToNow(new Date(a.at), { addSuffix: true })}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Upcoming Shifts</CardTitle>
              <CardDescription>Tomorrow's schedule</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/shifts">Manage</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-1">
                {data?.upcomingShifts.map((s) => (
                  <div key={s.id} className="flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-muted/50">
                    <span className="h-8 w-1 rounded-full" style={{ background: s.color }} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium">{s.shiftName}</p>
                      <p className="text-[11px] text-muted-foreground">{s.department}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold tabular">
                        {s.startTime}–{s.endTime}
                      </p>
                      <p className="text-[10px] text-muted-foreground">{s.assignedCount} assigned</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
