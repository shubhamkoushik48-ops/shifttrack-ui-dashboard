"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AttendanceTrendPoint, DepartmentDistribution } from "@/types";

export const CHART_COLORS = ["#2563EB", "#22C55E", "#F59E0B", "#EF4444", "#8B5CF6", "#0EA5E9"];

const AXIS_STYLE = { fontSize: 11, fill: "hsl(var(--muted-foreground))" } as const;

function TooltipShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-popover px-3 py-2 shadow-popover">
      {children}
    </div>
  );
}

function TrendTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name?: string; value?: number; color?: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <TooltipShell>
      <p className="mb-1.5 text-xs font-semibold">{label}</p>
      <div className="space-y-1">
        {payload.map((entry, i) => (
          <div key={i} className="flex items-center gap-2 text-[11px]">
            <span className="h-2 w-2 rounded-full" style={{ background: entry.color }} />
            <span className="capitalize text-muted-foreground">{entry.name}</span>
            <span className="ml-auto font-semibold tabular">{entry.value}</span>
          </div>
        ))}
      </div>
    </TooltipShell>
  );
}

export function AttendanceTrendChart({
  data,
  height = 280,
}: {
  data: AttendanceTrendPoint[];
  height?: number;
}) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -14, bottom: 0 }}>
          <defs>
            <linearGradient id="gradPresent" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563EB" stopOpacity={0.28} />
              <stop offset="100%" stopColor="#2563EB" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="gradLate" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#F59E0B" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
          <XAxis dataKey="date" tick={AXIS_STYLE} tickLine={false} axisLine={false} dy={6} interval="preserveStartEnd" />
          <YAxis tick={AXIS_STYLE} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip content={<TrendTooltip />} cursor={{ stroke: "hsl(var(--border))" }} />
          <Area type="monotone" dataKey="present" stroke="#2563EB" strokeWidth={2} fill="url(#gradPresent)" stackId="1" />
          <Area type="monotone" dataKey="late" stroke="#F59E0B" strokeWidth={2} fill="url(#gradLate)" stackId="1" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DepartmentDonut({ data }: { data: DepartmentDistribution[] }) {
  return (
    <div className="h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="employees"
            nameKey="department"
            innerRadius="58%"
            outerRadius="85%"
            paddingAngle={3}
            strokeWidth={0}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<TrendTooltip />} />
          <Legend
            verticalAlign="bottom"
            iconType="circle"
            iconSize={8}
            formatter={(value) => <span style={{ fontSize: 11, color: "hsl(var(--muted-foreground))" }}>{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function UtilizationBarChart({
  data,
  height = 280,
}: {
  data: { shift: string; utilization: number }[];
  height?: number;
}) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
          <XAxis type="number" domain={[0, 100]} tick={AXIS_STYLE} tickLine={false} axisLine={false} unit="%" />
          <YAxis type="category" dataKey="shift" width={110} tick={AXIS_STYLE} tickLine={false} axisLine={false} />
          <Tooltip content={<TrendTooltip />} cursor={{ fill: "hsl(var(--muted))", opacity: 0.5 }} />
          <Bar dataKey="utilization" fill="#2563EB" radius={[0, 6, 6, 0]} barSize={18} name="Utilization" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
