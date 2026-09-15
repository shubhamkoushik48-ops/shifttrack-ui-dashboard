"use client";

import { motion } from "framer-motion";
import { Wifi, BatteryLow, Radio } from "lucide-react";
import { cn, initials } from "@/lib/utils";
import type { BusinessLocation, EmployeePresence } from "@/types";

const ZONE_COLORS: Record<string, string> = {
  workspace: "border-primary/25 bg-primary/[0.07]",
  meeting: "border-violet-500/25 bg-violet-500/[0.07]",
  focus: "border-cyan-500/25 bg-cyan-500/[0.07]",
  social: "border-amber-500/25 bg-amber-500/[0.07]",
  utility: "border-slate-400/25 bg-slate-400/[0.07]",
};

interface FloorPlanProps {
  location: BusinessLocation;
  presence: EmployeePresence[];
  selectedEmployeeId: string | null;
  onSelectEmployee: (id: string | null) => void;
}

export function FloorPlan({ location, presence, selectedEmployeeId, onSelectEmployee }: FloorPlanProps) {
  const onSite = presence.filter((p) => p.status === "on_site" && p.locationId === location.id);

  return (
    <div className="relative w-full overflow-hidden rounded-xl border bg-grid-pattern bg-muted/20" style={{ aspectRatio: "16/9" }}>
      {/* Zones */}
      {location.zones.map((z) => (
        <div
          key={z.id}
          className={cn("absolute rounded-lg border", ZONE_COLORS[z.kind] ?? ZONE_COLORS.utility)}
          style={{
            left: `${z.x * 100}%`,
            top: `${z.y * 100}%`,
            width: `${z.w * 100}%`,
            height: `${z.h * 100}%`,
          }}
        >
          <span className="absolute left-1.5 top-1.5 max-w-full truncate pr-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            {z.name}
          </span>
        </div>
      ))}

      {/* People */}
      {onSite.map((p) => {
        const selected = p.employeeId === selectedEmployeeId;
        return (
          <motion.button
            key={p.employeeId}
            type="button"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{
              opacity: selectedEmployeeId && !selected ? 0.35 : 1,
              scale: 1,
              left: `${(p.x ?? 0.5) * 100}%`,
              top: `${(p.y ?? 0.5) * 100}%`,
            }}
            transition={{ type: "spring", stiffness: 60, damping: 18 }}
            onClick={() => onSelectEmployee(selected ? null : p.employeeId)}
            className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${(p.x ?? 0.5) * 100}%`, top: `${(p.y ?? 0.5) * 100}%` }}
            aria-label={p.employeeName}
          >
            <span className="relative flex">
              {selected && <span className="absolute -inset-1.5 animate-ping rounded-full bg-primary/30" />}
              <span
                className={cn(
                  "relative flex h-7 w-7 items-center justify-center rounded-full border-2 text-[9px] font-bold shadow-md transition-colors",
                  selected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-card bg-card text-foreground",
                )}
              >
                {initials(p.employeeName)}
              </span>
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-card bg-success" />
            </span>
          </motion.button>
        );
      })}

      {/* Legend */}
      <div className="glass absolute bottom-2.5 left-2.5 flex items-center gap-3 rounded-lg border px-3 py-1.5 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <Radio className="h-3 w-3 text-success" /> {onSite.length} on site
        </span>
        <span className="flex items-center gap-1">
          <Wifi className="h-3 w-3" /> phone GPS · Wi-Fi · BLE
        </span>
        <span className="hidden items-center gap-1 sm:flex">
          <BatteryLow className="h-3 w-3" /> live accuracy ±{Math.min(...onSite.map((p) => p.accuracyM), 30)}m
        </span>
      </div>
    </div>
  );
}
