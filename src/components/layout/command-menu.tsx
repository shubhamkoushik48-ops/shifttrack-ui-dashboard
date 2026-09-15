"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  Activity,
  BarChart3,
  CalendarClock,
  Fingerprint,
  LogOut,
  Moon,
  PlaneTakeoff,
  Search,
  Sun,
  Users,
  Timer,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useUiStore } from "@/store/ui-store";
import { useAuthStore } from "@/store/auth-store";
import { useEmployees } from "@/hooks/use-queries";
import { useQueryClient } from "@tanstack/react-query";

const PAGES = [
  { label: "Overview", href: "/dashboard/overview", icon: Activity },
  { label: "Employees", href: "/dashboard/employees", icon: Users },
  { label: "Shifts", href: "/dashboard/shifts", icon: Timer },
  { label: "Attendance", href: "/dashboard/attendance", icon: Fingerprint },
  { label: "Leave", href: "/dashboard/leave", icon: PlaneTakeoff },
  { label: "Reports", href: "/dashboard/reports", icon: BarChart3 },
];

export function CommandMenu() {
  const open = useUiStore((s) => s.commandOpen);
  const setOpen = useUiStore((s) => s.setCommandOpen);
  const router = useRouter();
  const { setTheme, resolvedTheme } = useTheme();
  const logout = useAuthStore((s) => s.logout);
  const queryClient = useQueryClient();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(!useUiStore.getState().commandOpen);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setOpen]);

  // Prefetch employee names for search
  const { data } = useEmployees({ page: 1, pageSize: 100 });
  const employees = data?.data ?? [];

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="top-[20%] max-w-xl translate-y-0 gap-0 overflow-hidden p-0">
        <DialogTitle className="sr-only">Command menu</DialogTitle>
        <Command className="w-full" loop>
          <div className="flex items-center gap-2 border-b px-4">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <Command.Input
              autoFocus
              placeholder="Search pages, people, actions…"
              className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            <kbd className="rounded border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">ESC</kbd>
          </div>
          <Command.List className="max-h-[360px] overflow-y-auto p-2">
            <Command.Empty className="py-8 text-center text-sm text-muted-foreground">
              No results found.
            </Command.Empty>

            <Command.Group heading="Pages" className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-muted-foreground">
              {PAGES.map((p) => (
                <Command.Item
                  key={p.href}
                  value={`page ${p.label}`}
                  onSelect={() => go(p.href)}
                  className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-2 text-sm aria-selected:bg-accent/60"
                >
                  <p.icon className="h-4 w-4 text-muted-foreground" />
                  {p.label}
                </Command.Item>
              ))}
            </Command.Group>

            <Command.Group heading="People" className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-muted-foreground">
              {employees.slice(0, 8).map((e) => (
                <Command.Item
                  key={e.id}
                  value={`person ${e.name} ${e.employeeCode}`}
                  onSelect={() => go("/dashboard/employees")}
                  className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-2 text-sm aria-selected:bg-accent/60"
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[9px] font-bold text-primary">
                    {e.name.slice(0, 2).toUpperCase()}
                  </span>
                  <span className="flex-1 truncate">{e.name}</span>
                  <span className="text-[10px] text-muted-foreground">{e.employeeCode}</span>
                </Command.Item>
              ))}
            </Command.Group>

            <Command.Group heading="Actions" className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-muted-foreground">
              <Command.Item
                value="toggle theme dark light"
                onSelect={() => {
                  setTheme(resolvedTheme === "dark" ? "light" : "dark");
                  setOpen(false);
                }}
                className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-2 text-sm aria-selected:bg-accent/60"
              >
                {resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                Switch to {resolvedTheme === "dark" ? "light" : "dark"} mode
              </Command.Item>
              <Command.Item
                value="sign out logout"
                onSelect={() => {
                  logout();
                  queryClient.clear();
                  setOpen(false);
                  router.push("/login");
                }}
                className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-2 text-sm text-destructive aria-selected:bg-destructive/10"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </Command.Item>
            </Command.Group>
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
