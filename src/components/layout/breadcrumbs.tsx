"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { Fragment } from "react";

const LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  overview: "Overview",
  employees: "Employees",
  shifts: "Shifts",
  attendance: "Attendance",
  leave: "Leave",
  locations: "Locations",
  reports: "Reports",
};

export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs text-muted-foreground">
      <Link href="/dashboard/overview" className="flex items-center gap-1 rounded px-1 py-0.5 hover:text-foreground">
        <Home className="h-3 w-3" />
        {!segments.length || segments.length <= 1 ? null : <span>ShiftTrack</span>}
      </Link>
      {segments.map((seg, i) => {
        const isLast = i === segments.length - 1;
        const href = "/" + segments.slice(0, i + 1).join("/");
        return (
          <Fragment key={href}>
            <ChevronRight className="h-3 w-3 opacity-50" />
            {isLast ? (
              <span className="font-medium text-foreground">{LABELS[seg] ?? seg}</span>
            ) : (
              <Link href={href} className="rounded px-0.5 py-0.5 hover:text-foreground">
                {LABELS[seg] ?? seg}
              </Link>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}
