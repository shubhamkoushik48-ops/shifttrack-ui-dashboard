"use client";

import { useMemo, useState } from "react";
import {
  Check,
  CheckCircle2,
  Eye,
  Loader2,
  PlaneTakeoff,
  X,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton, EmptyState } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/input";
import { StatusBadge } from "@/components/dashboard/attendance-status-badge";
import { useDecideLeave, useLeaveRequests } from "@/hooks/use-queries";
import { LEAVE_TYPE_LABELS } from "@/constants";
import { cn } from "@/lib/utils";
import type { LeaveRequest } from "@/types";

type TabKey = "pending" | "approved" | "rejected";

export default function LeavePage() {
  const [tab, setTab] = useState<TabKey>("pending");
  const [detail, setDetail] = useState<LeaveRequest | null>(null);
  const [rejectTarget, setRejectTarget] = useState<LeaveRequest | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const decide = useDecideLeave();

  const { data, isLoading, isError, refetch } = useLeaveRequests(tab);

  const counts = useLeaveRequests("all").data ?? [];
  const countFor = (s: TabKey) => counts.filter((r) => r.status === s).length;

  const rows = useMemo(() => data ?? [], [data]);

  const approve = async (req: LeaveRequest) => {
    await decide.mutateAsync({ id: req.id, action: "approve" });
    setDetail(null);
  };

  const reject = async () => {
    if (!rejectTarget) return;
    await decide.mutateAsync({ id: rejectTarget.id, action: "reject", note: rejectNote || undefined });
    setRejectTarget(null);
    setRejectNote("");
    setDetail(null);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Leave Management"
        description="Review, approve or decline time-off requests."
        actions={
          <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-1.5">
            <PlaneTakeoff className="h-4 w-4 text-info" />
            <span className="text-xs text-muted-foreground">
              <span className="font-bold text-foreground tabular">{countFor("pending")}</span> awaiting review
            </span>
          </div>
        }
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
        <TabsList>
          <TabsTrigger value="pending" className="gap-1.5">
            Pending
            <span className="rounded-full bg-warning/15 px-1.5 text-[10px] font-bold text-warning">{countFor("pending")}</span>
          </TabsTrigger>
          <TabsTrigger value="approved" className="gap-1.5">
            Approved
            <span className="rounded-full bg-success/15 px-1.5 text-[10px] font-bold text-success">{countFor("approved")}</span>
          </TabsTrigger>
          <TabsTrigger value="rejected" className="gap-1.5">
            Rejected
            <span className="rounded-full bg-destructive/15 px-1.5 text-[10px] font-bold text-destructive">{countFor("rejected")}</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {isError ? (
        <Card>
          <ErrorState onRetry={() => void refetch()} />
        </Card>
      ) : isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-[76px] w-full rounded-xl" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <Card>
          <EmptyState
            icon={<CheckCircle2 className="h-5 w-5" />}
            title={`No ${tab} requests`}
            description={
              tab === "pending"
                ? "The approval queue is clear. New requests will appear here instantly."
                : `No requests have been ${tab} yet.`
            }
          />
        </Card>
      ) : (
        <div className="space-y-2.5">
          {rows.map((req, i) => (
            <Card
              key={req.id}
              className={cn(
                "group p-4 transition-all hover:shadow-lifted",
                tab === "pending" && "border-l-4 border-l-warning/70",
              )}
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <Avatar name={req.employeeName} className="h-10 w-10" />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[14px] font-semibold">{req.employeeName}</p>
                      <Badge variant="muted">{LEAVE_TYPE_LABELS[req.type]}</Badge>
                      <StatusBadge status={req.status} />
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {req.department} · {format(new Date(req.fromDate), "MMM d")} – {format(new Date(req.toDate), "MMM d, yyyy")} ·{" "}
                      <span className="font-semibold text-foreground">{req.days}d</span>
                    </p>
                    <p className="mt-0.5 line-clamp-1 text-xs italic text-muted-foreground/80">“{req.reason}”</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 lg:ml-auto">
                  <span className="hidden text-[11px] text-muted-foreground sm:block">
                    {formatDistanceToNow(new Date(req.submittedAt), { addSuffix: true })}
                  </span>
                  <Button variant="ghost" size="icon-sm" title="Review details" onClick={() => setDetail(req)}>
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                  {req.status === "pending" ? (
                    <>
                      <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => setRejectTarget(req)}>
                        <X /> Reject
                      </Button>
                      <Button variant="success" size="sm" disabled={decide.isPending} onClick={() => void approve(req)}>
                        {decide.isPending && decide.variables?.id === req.id ? <Loader2 className="animate-spin" /> : <Check />} Approve
                      </Button>
                    </>
                  ) : req.decidedAt ? (
                    <span className="text-[11px] text-muted-foreground">
                      by {req.decidedBy} · {format(new Date(req.decidedAt), "MMM d")}
                    </span>
                  ) : null}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Details dialog */}
      <Dialog open={!!detail} onOpenChange={(v) => !v && setDetail(null)}>
        <DialogContent className="sm:max-w-lg">
          {detail && (
            <>
              <DialogHeader>
                <DialogTitle>Leave request details</DialogTitle>
                <DialogDescription>Full context before you decide.</DialogDescription>
              </DialogHeader>

              <div className="flex items-center gap-3 rounded-xl border bg-muted/30 p-3">
                <Avatar name={detail.employeeName} className="h-11 w-11" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{detail.employeeName}</p>
                  <p className="text-xs text-muted-foreground">{detail.department}</p>
                </div>
                <StatusBadge status={detail.status} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border p-3">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Leave type</p>
                  <p className="mt-1 text-[13px] font-semibold">{LEAVE_TYPE_LABELS[detail.type]}</p>
                </div>
                <div className="rounded-xl border p-3">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Duration</p>
                  <p className="mt-1 text-[13px] font-semibold">{detail.days} day{detail.days > 1 ? "s" : ""}</p>
                </div>
                <div className="rounded-xl border p-3">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">From</p>
                  <p className="mt-1 text-[13px] font-semibold">{format(new Date(detail.fromDate), "EEE, MMM d, yyyy")}</p>
                </div>
                <div className="rounded-xl border p-3">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">To</p>
                  <p className="mt-1 text-[13px] font-semibold">{format(new Date(detail.toDate), "EEE, MMM d, yyyy")}</p>
                </div>
              </div>

              <div className="rounded-xl border p-3">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Reason</p>
                <p className="mt-1 text-[13px] leading-relaxed">{detail.reason}</p>
              </div>

              <p className="text-[11px] text-muted-foreground">
                Submitted {formatDistanceToNow(new Date(detail.submittedAt), { addSuffix: true })} · Request ID {detail.id}
              </p>

              {detail.status === "pending" && (
                <DialogFooter>
                  <Button
                    variant="outline"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => {
                      setRejectTarget(detail);
                      setDetail(null);
                    }}
                  >
                    <X /> Reject
                  </Button>
                  <Button variant="success" disabled={decide.isPending} onClick={() => void approve(detail)}>
                    {decide.isPending ? <Loader2 className="animate-spin" /> : <Check />} Approve request
                  </Button>
                </DialogFooter>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject dialog */}
      <Dialog open={!!rejectTarget} onOpenChange={(v) => !v && setRejectTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject request</DialogTitle>
            <DialogDescription>
              Optionally add a note — {rejectTarget?.employeeName} will see it in their app.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={rejectNote}
            onChange={(e) => setRejectNote(e.target.value)}
            placeholder="e.g. Team capacity is tight during this window…"
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectTarget(null)}>Cancel</Button>
            <Button variant="destructive" disabled={decide.isPending} onClick={() => void reject()}>
              {decide.isPending && <Loader2 className="animate-spin" />} Reject request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
