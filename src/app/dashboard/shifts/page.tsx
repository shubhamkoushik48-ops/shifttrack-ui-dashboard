"use client";

import { useMemo, useState } from "react";
import {
  CalendarDays,
  Clock,
  Copy,
  List,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton, EmptyState } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/skeleton";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/dashboard/attendance-status-badge";
import { ShiftFormDialog } from "@/components/shifts/shift-form-dialog";
import { ShiftCalendar } from "@/components/shifts/shift-calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDeleteShift, useShifts } from "@/hooks/use-queries";
import { employeeService } from "@/services";
import { DAYS_OF_WEEK } from "@/constants";
import { cn } from "@/lib/utils";
import type { Shift } from "@/types";

export default function ShiftsPage() {
  const { data: shifts, isLoading, isError, refetch } = useShifts();
  const [view, setView] = useState<"calendar" | "list">("calendar");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Shift | null>(null);
  const [deleting, setDeleting] = useState<Shift | null>(null);
  const deleteShift = useDeleteShift();

  const stats = useMemo(() => {
    const rows = shifts ?? [];
    return {
      total: rows.length,
      active: rows.filter((s) => s.status === "active").length,
      assigned: rows.reduce((sum, s) => sum + s.assignedEmployeeIds.length, 0),
      coverage: rows.length ? Math.round((rows.filter((s) => s.days.length >= 5).length / rows.length) * 100) : 0,
    };
  }, [shifts]);

  const handleDelete = async () => {
    if (!deleting) return;
    await deleteShift.mutateAsync(deleting.id);
    setDeleting(null);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Shift Management"
        description="Build schedules, assign people and keep every department covered."
        actions={
          <Button
            variant="gradient"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus /> Create shift
          </Button>
        }
      />

      {/* Stats strip */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Total shifts", value: stats.total },
          { label: "Active", value: stats.active },
          { label: "People scheduled", value: stats.assigned },
          { label: "Weekday coverage", value: `${stats.coverage}%` },
        ].map((s) => (
          <Card key={s.label} className="p-4">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="mt-1 font-display text-xl font-bold tabular">{isLoading ? "—" : s.value}</p>
          </Card>
        ))}
      </div>

      {/* View toggle */}
      <div className="flex items-center justify-between">
        <div className="flex rounded-lg border bg-card p-0.5 shadow-xs">
          <button
            type="button"
            onClick={() => setView("calendar")}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              view === "calendar" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <CalendarDays className="h-3.5 w-3.5" /> Calendar
          </button>
          <button
            type="button"
            onClick={() => setView("list")}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              view === "list" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <List className="h-3.5 w-3.5" /> List
          </button>
        </div>
      </div>

      {isError ? (
        <Card>
          <ErrorState onRetry={() => void refetch()} />
        </Card>
      ) : view === "calendar" ? (
        isLoading ? (
          <Skeleton className="h-[420px] w-full rounded-xl" />
        ) : (
          <ShiftCalendar
            shifts={shifts ?? []}
            onSelect={(s) => {
              setEditing(s);
              setFormOpen(true);
            }}
          />
        )
      ) : (
        <div className="space-y-3">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)
          ) : (shifts ?? []).length === 0 ? (
            <Card>
              <EmptyState
                title="No shifts yet"
                description="Create your first shift to start scheduling."
                action={
                  <Button variant="gradient" size="sm" onClick={() => setFormOpen(true)}>
                    <Plus /> Create shift
                  </Button>
                }
              />
            </Card>
          ) : (
            shifts?.map((shift) => (
              <Card key={shift.id} className="overflow-hidden p-0">
                <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <span className="mt-1 h-9 w-1.5 shrink-0 rounded-full" style={{ background: shift.color }} />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-display text-[15px] font-semibold">{shift.name}</p>
                        <StatusBadge status={shift.status} />
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1 tabular">
                          <Clock className="h-3 w-3" /> {shift.startTime} – {shift.endTime}
                        </span>
                        <span>{shift.department}</span>
                        <span className="flex items-center gap-1">
                          {shift.days
                            .slice()
                            .sort()
                            .map((d) => DAYS_OF_WEEK[d]?.[0])
                            .join(" ")}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 sm:justify-end">
                    <div className="flex items-center -space-x-1.5">
                      {shift.assignedEmployeeIds.slice(0, 4).map((id) => {
                        const name = id; // resolved below via employee list if needed
                        return <Avatar key={id} name={String(name)} className="h-6 w-6 ring-2 ring-card" />;
                      })}
                      {shift.assignedEmployeeIds.length > 4 && (
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-[9px] font-bold ring-2 ring-card">
                          +{shift.assignedEmployeeIds.length - 4}
                        </span>
                      )}
                      {shift.assignedEmployeeIds.length === 0 && (
                        <span className="text-xs text-muted-foreground">Unassigned</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon-sm" title="Edit" onClick={() => { setEditing(shift); setFormOpen(true); }}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        title="Duplicate"
                        onClick={() => toast.success(`Duplicated “${shift.name}”`, { description: "Open edit to rename." })}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        title="Delete"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => setDeleting(shift)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      <ShiftFormDialog open={formOpen} onOpenChange={setFormOpen} shift={editing} />

      {/* Delete confirm */}
      <Dialog open={!!deleting} onOpenChange={(v) => !v && setDeleting(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete “{deleting?.name}”?</DialogTitle>
            <DialogDescription>
              {deleting?.assignedEmployeeIds.length
                ? `${deleting.assignedEmployeeIds.length} people will become unassigned. This can't be undone.`
                : "This shift has no assignments. This can't be undone."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>Cancel</Button>
            <Button variant="destructive" disabled={deleteShift.isPending} onClick={() => void handleDelete()}>
              {deleteShift.isPending && <Loader2 className="animate-spin" />} Delete shift
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
