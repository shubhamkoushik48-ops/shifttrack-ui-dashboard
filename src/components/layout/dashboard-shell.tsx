"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { useUiStore } from "@/store/ui-store";
import { useRealtimeBridge } from "@/hooks/use-realtime";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { CommandMenu } from "./command-menu";
import { PageLoader } from "@/components/ui/skeleton";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const session = useAuthStore((s) => s.session);
  const hydrated = useAuthStore((s) => s.hydrated);
  const router = useRouter();
  const pathname = usePathname();
  const setMobileOpen = useUiStore((s) => s.setMobileSidebarOpen);

  useRealtimeBridge();

  useEffect(() => {
    // localStorage persist is synchronous — mark hydrated after first mount as a
    // belt-and-braces fallback alongside onRehydrateStorage.
    if (!useAuthStore.getState().hydrated) {
      useAuthStore.setState({ hydrated: true });
    }
  }, []);

  useEffect(() => {
    if (hydrated && !session) router.replace("/login");
  }, [hydrated, session, router]);

  // Close mobile drawer on navigation
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname, setMobileOpen]);

  if (!hydrated) {
    return <PageLoader label="Preparing your workspace…" />;
  }

  if (!session) {
    return <PageLoader label="Redirecting to sign in…" />;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-6 md:px-6 lg:px-8">{children}</main>
      </div>
      <CommandMenu />
    </div>
  );
}
