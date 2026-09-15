"use client";

import { useEffect, useRef } from "react";
import { motion, useInView, useMotionValue, useSpring } from "framer-motion";
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
  primary: { bg: "bg-primary/10", text: "text-primary", stroke: "stroke-primary/25" },
  success: { bg: "bg-success/10", text: "text-success", stroke: "stroke-success/25" },
  warning: { bg: "bg-warning/10", text: "text-warning", stroke: "stroke-warning/25" },
  danger: { bg: "bg-destructive/10", text: "text-destructive", stroke: "stroke-destructive/25" },
  info: { bg: "bg-info/10", text: "text-info", stroke: "stroke-info/25" },
} as const;

function AnimatedNumber({ value, suffix = "" }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { stiffness: 90, damping: 24 });

  useEffect(() => {
    if (inView) mv.set(value);
  }, [inView, value, mv]);

  useEffect(() => {
    const unsub = spring.on("change", (v) => {
      if (ref.current) ref.current.textContent = `${Math.round(v).toLocaleString()}${suffix}`;
    });
    return unsub;
  }, [spring, suffix]);

  return <span ref={ref}>0{suffix}</span>;
}

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
        "group relative overflow-hidden p-5 transition-all hover:-translate-y-0.5 hover:shadow-lifted",
        onClick && "cursor-pointer",
      )}
    >
      <div className={cn("absolute -right-8 -top-8 h-28 w-28 rounded-full opacity-60 blur-2xl", styles.bg)} />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-[13px] font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 font-display text-[28px] font-bold leading-none tracking-tight tabular">
            {loading ? <span className="inline-block h-7 w-16 animate-pulse rounded-md bg-muted" /> : <AnimatedNumber value={value} suffix={suffix} />}
          </p>
        </div>
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl transition-transform group-hover:scale-105", styles.bg)}>
          <Icon className={cn("h-5 w-5", styles.text)} />
        </div>
      </div>
      {!loading && delta !== undefined && (
        <div className="relative mt-3 flex items-center gap-1.5 text-xs">
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-semibold",
              delta >= 0 ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive",
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
