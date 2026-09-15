"use client";

import { useEffect, useState } from "react";
import { Bell, Check, LogOut, Menu, Search, Settings, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { useUiStore } from "@/store/ui-store";
import { useAuthStore } from "@/store/auth-store";
import { cn, initials } from "@/lib/utils";
import type { AppNotification } from "@/types";

const TONE_STYLES: Record<AppNotification["tone"], string> = {
  info: "bg-info/15 text-info",
  success: "bg-success/15 text-success",
  warning: "bg-warning/15 text-warning",
  danger: "bg-destructive/15 text-destructive",
};

function NotificationBell() {
  const notifications = useUiStore((s) => s.notifications);
  const markAllRead = useUiStore((s) => s.markAllRead);
  const clear = useUiStore((s) => s.clearNotifications);
  const [open, setOpen] = useState(false);
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-[18px] w-[18px]" />
          {unread > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[360px] p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div>
            <p className="text-sm font-semibold">Notifications</p>
            <p className="text-[11px] text-muted-foreground">
              {unread > 0 ? `${unread} unread` : "You're all caught up"}
            </p>
          </div>
          {notifications.length > 0 && (
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" onClick={markAllRead}>
                <Check className="mr-1 h-3.5 w-3.5" /> Read all
              </Button>
              <Button variant="ghost" size="icon-sm" onClick={clear} aria-label="Clear all">
                ×
              </Button>
            </div>
          )}
        </div>
        <div className="max-h-[360px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <Bell className="mx-auto mb-2 h-6 w-6 text-muted-foreground/40" />
              <p className="text-xs text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={cn(
                  "flex gap-3 border-b border-border/60 px-4 py-3 last:border-0 hover:bg-muted/40",
                  !n.read && "bg-primary/[0.04]",
                )}
              >
                <span className={cn("mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg", TONE_STYLES[n.tone])}>
                  <Bell className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium">{n.title}</p>
                  <p className="line-clamp-2 text-xs text-muted-foreground">{n.body}</p>
                  <p className="mt-1 text-[10px] text-muted-foreground/70">
                    {formatDistanceToNow(new Date(n.at), { addSuffix: true })}
                  </p>
                </div>
                {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
              </div>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ConnectionIndicator() {
  const [status, setStatus] = useState({ connected: true, latencyMs: null as number | null });
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setStatus({ connected: detail.connected, latencyMs: detail.latencyMs });
    };
    window.addEventListener("shifttrack:ws-status", handler);
    return () => window.removeEventListener("shifttrack:ws-status", handler);
  }, []);

  return (
    <div className="hidden items-center gap-1.5 rounded-full border bg-card px-2.5 py-1 lg:flex" title="Realtime connection">
      <span className={cn("relative flex h-2 w-2")}>
        <span
          className={cn(
            "absolute inline-flex h-full w-full animate-ping rounded-full opacity-60",
            status.connected ? "bg-success" : "bg-destructive",
          )}
        />
        <span className={cn("relative inline-flex h-2 w-2 rounded-full", status.connected ? "bg-success" : "bg-destructive")} />
      </span>
      <span className="text-[11px] font-medium text-muted-foreground">
        {status.connected ? (status.latencyMs != null ? `${status.latencyMs}ms` : "Live") : "Offline"}
      </span>
    </div>
  );
}

export function Topbar() {
  const router = useRouter();
  const setMobileOpen = useUiStore((s) => s.setMobileSidebarOpen);
  const setCommandOpen = useUiStore((s) => s.setCommandOpen);
  const session = useAuthStore((s) => s.session);
  const logout = useAuthStore((s) => s.logout);
  const user = session?.user;

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <header className="glass sticky top-0 z-20 flex h-16 items-center gap-3 border-b px-4 md:px-6">
      <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu">
        <Menu className="h-5 w-5" />
      </Button>

      {/* Search */}
      <button
        type="button"
        onClick={() => setCommandOpen(true)}
        className="group hidden h-9 w-full max-w-md items-center gap-2 rounded-lg border bg-card/60 px-3 text-sm text-muted-foreground shadow-xs transition-colors hover:border-primary/40 hover:bg-card md:flex"
      >
        <Search className="h-4 w-4" />
        <span className="flex-1 text-left">Search employees, shifts, pages…</span>
        <kbd className="rounded border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">⌘K</kbd>
      </button>

      <div className="ml-auto flex items-center gap-1.5">
        <ConnectionIndicator />
        <ThemeToggle />
        <NotificationBell />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="ml-1 flex items-center gap-2.5 rounded-full border bg-card py-1 pl-1 pr-2.5 shadow-xs transition-colors hover:bg-accent/50">
              <Avatar name={user?.name ?? "Manager"} className="h-7 w-7" />
              <div className="hidden text-left sm:block">
                <p className="max-w-[140px] truncate text-xs font-semibold leading-tight">{user?.name ?? "Manager"}</p>
                <p className="text-[10px] leading-tight text-muted-foreground capitalize">{user?.role ?? "manager"}</p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuLabel className="font-normal">
              <div className="flex items-center gap-3 py-1">
                <Avatar name={user?.name ?? "Manager"} className="h-9 w-9" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{user?.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" /> My profile
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" /> Workspace settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
