"use client";

import { motion } from "framer-motion";
import { Clock, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { DAYS_OF_WEEK } from "@/constants";
import { cn } from "@/lib/utils";
import type { Shift } from "@/types";

interface Props {
  shifts: Shift[];
  onSelect?: (shift: Shift) => void;
}

function shiftHour(hhmm: string): number {
  const [h] = hhmm.split(":");
  return Number(h);
}

export function ShiftCalendar({ shifts, onSelect }: Props) {
  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <Card className="overflow-hidden p-0">
      <div className="overflow-x-auto">
        <div className="min-w-[760px]">
          {/* Header row */}
          <div className="sticky top-0 z-10 grid grid-cols-[60px_repeat(7,1fr)] border-b bg-muted/40 backdrop-blur">
            <div className="border-r px-2 py-2.5 text-[10px] font-semibold uppercase text-muted-foreground">GMT</div>
            {DAYS_OF_WEEK.map((d) => (
              <div key={d} className="border-r px-2 py-2.5 text-center text-xs font-semibold last:border-0">
                {d}
              </div>
            ))}
          </div>

          <div className="relative grid grid-cols-[60px_repeat(7,1fr)]">
            {/* Hour column */}
            <div className="border-r">
              {hours.map((h) => (
                <div key={h} className="relative h-14 border-b border-border/50 last:border-0">
                  <span className="absolute -top-2 right-2 text-[10px] tabular text-muted-foreground">
                    {`${h.toString().padStart(2, "0")}:00`}
                  </span>
                </div>
              ))}
            </div>

            {/* Day columns */}
            {DAYS_OF_WEEK.map((day, dayIdx) => (
              <div key={day} className="relative border-r last:border-0">
                {hours.map((h) => (
                  <div key={h} className="h-14 border-b border-border/50 last:border-0" />
                ))}
                {shifts
                  .filter((s) => s.days.includes(dayIdx) && s.status !== "archived")
                  .map((s, i) => {
                    const startH = shiftHour(s.startTime);
                    const endH = shiftHour(s.endTime);
                    const overnight = endH <= startH;
                    const top = startH * 56;
                    const height = overnight ? (24 - startH) * 56 : (endH - startH) * 56;
                    return (
                      <motion.button
                        key={s.id}
                        type="button"
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.04 }}
                        onClick={() => onSelect?.(s)}
                        className="absolute left-1 right-1 overflow-hidden rounded-lg border px-2 py-1.5 text-left shadow-sm transition-all hover:z-10 hover:shadow-md"
                        style={{
                          top: top + 2,
                          height: height - 4,
                          background: `color-mix(in srgb, ${s.color} 12%, transparent)`,
                          borderColor: `color-mix(in srgb, ${s.color} 35%, transparent)`,
                        }}
                      >
                        <span className="block truncate text-[11px] font-semibold" style={{ color: s.color }}>
                          {s.name}
                        </span>
                        <span className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Clock className="h-2.5 w-2.5" />
                          {s.startTime}–{s.endTime}
                        </span>
                        {height > 100 && (
                          <span className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Users className="h-2.5 w-2.5" /> {s.assignedEmployeeIds.length} assigned
                          </span>
                        )}
                      </motion.button>
                    );
                  })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
