"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Activity,
  ChevronsLeft,
  Timer,
  Users,
  Fingerprint,
  PlaneTakeoff,
  BarChart3,
  X,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/store/ui-store";
import { useAuthStore } from "@/store/auth-store";
import { useLeaveRequests } from "@/hooks/use-queries";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { APP_NAME, APP_TAGLINE, APP_VERSION } from "@/constants";
import type { LucideIcon } from "lucide-react";

interface NavEntry {
  label: string;
  href: string;
  icon: LucideIcon;
  badgeKey?: "leave" | "attendance";
}

const NAV: NavEntry[] = [
  { label: "Overview", href: "/dashboard/overview", icon: Activity },
  { label: "Employees", href: "/dashboard/employees", icon: Users },
  { label: "Shifts", href: "/dashboard/shifts", icon: Timer },
  { label: "Attendance", href: "/dashboard/attendance", icon: Fingerprint },
  { label: "Leave", href: "/dashboard/leave", icon: PlaneTakeoff, badgeKey: "leave" },
  { label: "Reports", href: "/dashboard/reports", icon: BarChart3 },
];

function NavRow({ entry, collapsed }: { entry: NavEntry; collapsed: boolean }) {
  const pathname = usePathname();
  const active = pathname === entry.href || pathname.startsWith(entry.href + "/");
  const { data: leave } = useLeaveRequests("pending");
  const pendingCount = entry.badgeKey === "leave" ? (leave?.length ?? 0) : 0;

  const content = (
    <Link
      href={entry.href}
      className={cn(
        "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors",
        collapsed && "justify-center px-0",
        active ? "text-sidebar-accent-foreground" : "text-sidebar-foreground hover:text-foreground",
      )}
    >
      {active && (
        <motion.span
          layoutId="nav-active"
          className="absolute inset-0 rounded-lg bg-sidebar-accent"
          transition={{ type: "spring", stiffness: 420, damping: 34 }}
        />
      )}
      <entry.icon className={cn("relative z-10 h-4 w-4 shrink-0", !active && "opacity-70 group-hover:opacity-100")} />
      {!collapsed && <span className="relative z-10">{entry.label}</span>}
      {!collapsed && pendingCount > 0 && (
        <span className="relative z-10 ml-auto rounded-full bg-white/15 px-1.5 py-0.5 text-[10px] font-semibold tabular">
          {pendingCount}
        </span>
      )}
      {collapsed && pendingCount > 0 && (
        <span className="absolute right-2 top-1.5 z-20 h-2 w-2 rounded-full bg-amber-400 ring-2 ring-sidebar" />
      )}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right">{entry.label}</TooltipContent>
      </Tooltip>
    );
  }
  return content;
}

function SidebarBrand({ collapsed }: { collapsed: boolean }) {
  return (
    <div className={cn("flex h-16 items-center gap-2.5 px-4", collapsed && "justify-center px-0")}>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 shadow-glow">
        <Timer className="h-4.5 w-4.5 text-white" strokeWidth={2.5} />
      </div>
      {!collapsed && (
        <div className="min-w-0">
          <p className="truncate font-display text-[15px] font-bold tracking-tight text-white">{APP_NAME}</p>
          <p className="truncate text-[10px] font-medium uppercase tracking-[0.14em] text-slate-400">{APP_TAGLINE}</p>
        </div>
      )}
    </div>
  );
}

function SidebarUser({ collapsed }: { collapsed: boolean }) {
  const session = useAuthStore((s) => s.session);
  const user = session?.user;
  if (!user) return null;
  return (
    <div className={cn("mx-3 mb-4 flex items-center gap-2.5 rounded-xl bg-white/5 p-2.5", collapsed && "justify-center p-2")}>
      <Avatar name={user.name} className="h-8 w-8" />
      {!collapsed && (
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-white">{user.name}</p>
          <p className="truncate text-[10px] text-slate-400 capitalize">{user.role} · {user.department}</p>
        </div>
      )}
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const mobileOpen = useUiStore((s) => s.mobileSidebarOpen);
  const setMobileOpen = useUiStore((s) => s.setMobileSidebarOpen);
  const toggle = useUiStore((s) => s.toggleSidebar);

  const sidebarInner = (collapsedState: boolean) => (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <SidebarBrand collapsed={collapsedState} />
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-3">
        {!collapsedState && (
          <p className="px-3 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            Workspace
          </p>
        )}
        {NAV.map((entry) => (
          <NavRow key={entry.href} entry={entry} collapsed={collapsedState} />
        ))}
        {!collapsedState && (
          <>
            <p className="px-3 pb-1 pt-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              System
            </p>
            <button
              type="button"
              onClick={toggle}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium text-sidebar-foreground hover:text-foreground"
            >
              <ChevronsLeft className="h-4 w-4 opacity-70" />
              Collapse menu
            </button>
          </>
        )}
      </nav>
      {!collapsedState && (
        <div className="mx-3 mb-3 rounded-xl border border-white/10 bg-gradient-to-br from-blue-600/20 to-indigo-600/10 p-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-blue-300" />
            <p className="text-[11px] font-semibold text-white">Live sync active</p>
          </div>
          <p className="mt-1 text-[10px] leading-relaxed text-slate-400">
            Realtime attendance streaming to every surface.
          </p>
        </div>
      )}
      <SidebarUser collapsed={collapsedState} />
      {collapsedState && (
        <button
          type="button"
          onClick={toggle}
          className="mb-4 flex justify-center text-slate-400 hover:text-white"
          aria-label="Expand sidebar"
        >
          <ChevronsLeft className="h-4 w-4 rotate-180" />
        </button>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 72 : 256 }}
        transition={{ type: "spring", stiffness: 320, damping: 32 }}
        className={cn("sticky top-0 z-30 hidden h-screen shrink-0 md:block", pathname !== "/" && "")}
      >
        {sidebarInner(collapsed)}
      </motion.aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px]"
            onClick={() => setMobileOpen(false)}
          />
          <motion.div
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            className="absolute inset-y-0 left-0 w-[264px] shadow-2xl"
          >
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute -right-11 top-3 rounded-lg bg-slate-900 p-2 text-white shadow-lg"
              aria-label="Close menu"
            >
              <X className="h-4 w-4" />
            </button>
            {sidebarInner(false)}
          </motion.div>
        </div>
      )}
    </>
  );
}
