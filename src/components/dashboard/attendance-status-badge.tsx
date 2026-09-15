import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const MAP: Record<string, { label: string; variant: "success" | "warning" | "danger" | "info" | "muted" | "default" }> = {
  present: { label: "Present", variant: "success" },
  remote: { label: "Remote", variant: "info" },
  late: { label: "Late", variant: "warning" },
  absent: { label: "Absent", variant: "danger" },
  on_leave: { label: "On Leave", variant: "info" },
  active: { label: "Active", variant: "success" },
  suspended: { label: "Suspended", variant: "warning" },
  inactive: { label: "Inactive", variant: "muted" },
  approved: { label: "Approved", variant: "success" },
  rejected: { label: "Rejected", variant: "danger" },
  pending: { label: "Pending", variant: "warning" },
  cancelled: { label: "Cancelled", variant: "muted" },
  draft: { label: "Draft", variant: "muted" },
  archived: { label: "Archived", variant: "muted" },
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const entry = MAP[status] ?? { label: status, variant: "muted" as const };
  return (
    <Badge variant={entry.variant} className={cn("capitalize", className)}>
      {entry.label}
    </Badge>
  );
}
