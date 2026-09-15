"use client";

import { Building2, Compass, MapPin, Navigation, Smartphone, Wifi } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatTime } from "@/lib/utils";
import type { EmployeePresence } from "@/types";

const SOURCE_LABEL: Record<string, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  phone_gps: { label: "Phone GPS", icon: Smartphone },
  wifi: { label: "Wi-Fi network", icon: Wifi },
  beacon: { label: "Office beacon", icon: Compass },
};

interface Props {
  presence: EmployeePresence | null;
  onClose: () => void;
}

export function PresenceDetailDialog({ presence, onClose }: Props) {
  if (!presence) return null;

  const source = SOURCE_LABEL[presence.source] ?? SOURCE_LABEL.phone_gps!;
  const SourceIcon = source.icon;

  return (
    <Dialog open={!!presence} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar name={presence.employeeName} className="h-9 w-9" />
            <span>
              {presence.employeeName}
              <span className="block text-xs font-normal text-muted-foreground">{presence.department}</span>
            </span>
          </DialogTitle>
          <DialogDescription>Live position shared from the employee&apos;s phone.</DialogDescription>
        </DialogHeader>

        <div className="space-y-2.5">
          <div className="flex items-center gap-3 rounded-xl border p-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <MapPin className="h-4.5 w-4.5 text-primary" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold">{presence.zoneName ?? "Zone unknown"}</p>
              <p className="text-xs text-muted-foreground">
                {presence.locationName ?? "Off site"} · floor plan position{" "}
                {presence.x != null && presence.y != null
                  ? `(${presence.x.toFixed(2)}, ${presence.y.toFixed(2)})`
                  : "—"}
              </p>
            </div>
            <Badge variant={presence.status === "on_site" ? "success" : presence.status === "en_route" ? "warning" : "muted"}>
              {presence.status.replace("_", " ")}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="rounded-xl border p-3">
              <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                <SourceIcon className="h-3 w-3" /> Signal source
              </p>
              <p className="mt-1 text-[13px] font-medium">{source.label}</p>
              <p className="text-[11px] text-muted-foreground">±{presence.accuracyM}m accuracy</p>
            </div>
            <div className="rounded-xl border p-3">
              <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                <Navigation className="h-3 w-3" /> Last ping
              </p>
              <p className="mt-1 text-[13px] font-medium tabular">{formatTime(presence.lastPingAt)}</p>
              <p className="text-[11px] text-muted-foreground">
                {presence.arrivedAt ? `Arrived ${formatTime(presence.arrivedAt)}` : "Not checked in"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-warning/25 bg-warning/[0.06] p-3">
            <Building2 className="h-4 w-4 shrink-0 text-warning" />
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              Tracking uses the employee&apos;s phone location while inside the office geofence. Position history is
              retained for 30 days and visible to managers only.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
