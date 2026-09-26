"use client";

import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  label: string;
  value: number;
  suffix?: string;
  delta?: number;
  deltaLabel?: string;
  icon: LucideIcon;
  tone?: "primary" | "success" | "warning" | "danger" | "info";
  loading?: boolean;
  onClick?: () => void;
}

const TONE_STYLES = {
  primary: { bg: "bg-primary/10", text: "text-primary" },
  success: { bg: "bg-success/10", text: "text-success" },
  warning: { bg: "bg-warning/10", text: "text-warning" },
  danger: { bg: "bg-destructive/10", text: "text-destructive" },
  info: { bg: "bg-info/10", text: "text-info" },
} as const;

export function KpiCard({
  label,
  value,
  suffix = "",
  delta,
  deltaLabel = "vs last week",
  icon: Icon,
  tone = "primary",
  loading,
  onClick,
}: KpiCardProps) {
  const styles = TONE_STYLES[tone];

  return (
    <Card
      onClick={onClick}
      className={cn(
        "p-5 transition-colors hover:bg-accent/[0.03]",
        onClick && "cursor-pointer",
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[13px] font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 text-[28px] font-semibold leading-none tracking-tight tabular text-foreground">
            {loading ? <span className="inline-block h-7 w-16 animate-pulse rounded-md bg-muted" /> : `${value.toLocaleString()}${suffix}`}
          </p>
        </div>
        <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", styles.bg)}>
          <Icon className={cn("h-[18px] w-[18px]", styles.text)} />
        </div>
      </div>
      {!loading && delta !== undefined && (
        <div className="mt-3 flex items-center gap-1.5 text-xs">
          <span
            className={cn(
              "inline-flex items-center gap-0.5 font-medium tabular",
              delta >= 0 ? "text-success" : "text-destructive",
            )}
          >
            {delta >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(delta)}%
          </span>
          <span className="text-muted-foreground">{deltaLabel}</span>
        </div>
      )}
    </Card>
  );
}
