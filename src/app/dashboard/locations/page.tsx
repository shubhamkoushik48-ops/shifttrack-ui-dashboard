"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bike,
  Building2,
  DoorOpen,
  Loader2,
  MapPin,
  MapPinned,
  MoreHorizontal,
  Pencil,
  Plus,
  Radio,
  Search,
  ShieldCheck,
  Smartphone,
  Trash2,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Skeleton, EmptyState, ErrorState } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FloorPlan } from "@/components/locations/floor-plan";
import { LocationFormDialog } from "@/components/locations/location-form-dialog";
import { DeleteLocationDialog } from "@/components/locations/delete-location-dialog";
import { PresenceDetailDialog } from "@/components/locations/presence-detail-dialog";
import { useLocations, usePresence, useToggleSharing } from "@/hooks/use-queries";
import { usePresenceStore } from "@/store/presence-store";
import { cn, formatTime } from "@/lib/utils";
import type { BusinessLocation, EmployeePresence } from "@/types";

export default function LocationsPage() {
  const { data: locations, isLoading, isError, refetch } = useLocations();
  const [selectedLocationId, setSelectedLocationId] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<BusinessLocation | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BusinessLocation | null>(null);
  const [detailTarget, setDetailTarget] = useState<EmployeePresence | null>(null);
  const [selectedDot, setSelectedDot] = useState<string | null>(null);
  const toggleSharing = useToggleSharing();

  // Mirror realtime presence events into the local store
  const livePresence = usePresenceStore((s) => s.presence);
  const hydratePresence = usePresenceStore((s) => s.hydrate);
  const { data: fetchedPresence, isLoading: presenceLoading } = usePresence(selectedLocationId);

  useEffect(() => {
    if (fetchedPresence) hydratePresence(fetchedPresence);
  }, [fetchedPresence, hydratePresence]);

  const presence = useMemo(() => {
    const rows = Array.from(livePresence.values());
    const filtered = selectedLocationId === "all" ? rows : rows.filter((p) => p.locationId === selectedLocationId);
    const searched = search
      ? filtered.filter((p) => p.employeeName.toLowerCase().includes(search.toLowerCase()))
      : filtered;
    return [...searched].sort((a, b) => a.employeeName.localeCompare(b.employeeName));
  }, [livePresence, selectedLocationId, search]);

  const summary = useMemo(() => {
    const onSite = presence.filter((p) => p.status === "on_site");
    return {
      onSite: onSite.length,
      enRoute: presence.filter((p) => p.status === "en_route").length,
      sharingPaused: presence.filter((p) => !p.sharingEnabled).length,
      tracked: presence.length,
    };
  }, [presence]);

  const activeLocation =
    selectedLocationId === "all"
      ? null
      : locations?.find((l) => l.id === selectedLocationId) ?? null;

  const floorPlanPresence = presence;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Business Locations"
        description="Manage offices, geofences and live on-site presence from employee phones."
        actions={
          <Button
            variant="gradient"
            onClick={() => {
              setEditTarget(null);
              setFormOpen(true);
            }}
          >
            <Plus /> Add office
          </Button>
        }
      />

      {/* Summary strip */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "On site now", value: summary.onSite, icon: Radio, tone: "text-success bg-success/10" },
          { label: "En route", value: summary.enRoute, icon: Bike, tone: "text-info bg-info/10" },
          { label: "Sharing paused", value: summary.sharingPaused, icon: ShieldCheck, tone: "text-warning bg-warning/10" },
          { label: "Tracked people", value: summary.tracked, icon: Smartphone, tone: "text-primary bg-primary/10" },
        ].map((k) => (
          <Card key={k.label} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{k.label}</p>
                <p className="mt-1 font-display text-2xl font-bold tabular">
                  {presenceLoading ? <span className="inline-block h-6 w-12 animate-pulse rounded bg-muted" /> : k.value}
                </p>
              </div>
              <span className={cn("flex h-9 w-9 items-center justify-center rounded-lg", k.tone)}>
                <k.icon className="h-4.5 w-4.5" />
              </span>
            </div>
          </Card>
        ))}
      </div>

      {/* Location selector */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSelectedLocationId("all")}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
              selectedLocationId === "all"
                ? "border-primary bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            All offices
          </button>
          {(locations ?? []).map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => setSelectedLocationId(l.id)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
                selectedLocationId === l.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              {l.name}
              {l.isHeadquarters ? " · HQ" : ""}
            </button>
          ))}
        </div>
        <div className="relative w-full lg:w-56">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Find a person…"
            className="h-9 pl-9"
          />
        </div>
      </div>

      {isError ? (
        <Card>
          <CardContent className="p-10">
            <ErrorState onRetry={() => void refetch()} />
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="grid gap-4 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-3">
          {/* Left column: office cards */}
          <div className="space-y-4 xl:col-span-1">
            {(locations ?? []).length === 0 && (
              <Card>
                <CardContent className="p-10">
                  <EmptyState
                    icon={<Building2 className="h-5 w-5" />}
                    title="No offices yet"
                    description="Add your first office to start tracking on-site presence."
                  />
                </CardContent>
              </Card>
            )}
            {(locations ?? []).map((loc) => {
              const onSite = presence.filter((p) => p.status === "on_site" && p.locationId === loc.id).length;
              return (
                <Card
                  key={loc.id}
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-lifted",
                    selectedLocationId === loc.id && "ring-2 ring-primary/40",
                  )}
                  onClick={() => setSelectedLocationId(loc.id)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                          <Building2 className="h-4.5 w-4.5 text-primary" />
                        </span>
                        <div>
                          <CardTitle className="text-[15px] leading-tight">
                            {loc.name}
                            {loc.isHeadquarters && (
                              <Badge className="ml-2 align-middle">HQ</Badge>
                            )}
                          </CardTitle>
                          <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                            <MapPin className="h-3 w-3" /> {loc.address}
                          </p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${loc.name}`}>
                            <MoreHorizontal />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenuItem
                            onClick={() => {
                              setEditTarget(loc);
                              setFormOpen(true);
                            }}
                          >
                            <Pencil /> Edit office
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeleteTarget(loc)}
                          >
                            <Trash2 /> Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2.5">
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant={loc.isOpen ? "success" : "muted"}>
                        {loc.isOpen ? "Open" : "Closed"}
                      </Badge>
                      <Badge variant="muted">{loc.timezone.split("/").pop()?.replace("_", " ")}</Badge>
                      <Badge variant="muted">Geofence {loc.geofenceRadiusM}m</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-lg bg-muted/50 py-1.5">
                        <p className="text-[10px] text-muted-foreground">On site</p>
                        <p className="text-sm font-bold tabular text-success">{onSite}</p>
                      </div>
                      <div className="rounded-lg bg-muted/50 py-1.5">
                        <p className="text-[10px] text-muted-foreground">Capacity</p>
                        <p className="text-sm font-bold tabular">{loc.capacity}</p>
                      </div>
                      <div className="rounded-lg bg-muted/50 py-1.5">
                        <p className="text-[10px] text-muted-foreground">Zones</p>
                        <p className="text-sm font-bold tabular">{loc.zones.length}</p>
                      </div>
                      </div>
                    <p className="text-[11px] text-muted-foreground">Managed by {loc.manager}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Right column: live floor plan + presence */}
          <div className="space-y-4 xl:col-span-2">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <MapPinned className="h-4.5 w-4.5 text-primary" />
                      Live floor plan{activeLocation ? ` — ${activeLocation.name}` : ""}
                    </CardTitle>
                    <CardDescription>
                      Positions update in real time from phone GPS while employees are inside the geofence.
                    </CardDescription>
                  </div>
                  <Badge variant="success" className="gap-1.5">
                    <Radio className="h-3 w-3" /> Live
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {activeLocation ? (
                  <FloorPlan
                    location={activeLocation}
                    presence={floorPlanPresence}
                    selectedEmployeeId={selectedDot}
                    onSelectEmployee={setSelectedDot}
                  />
                ) : (
                  <div className="flex h-64 flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-muted/20 text-center">
                    <MapPinned className="h-6 w-6 text-muted-foreground" />
                    <p className="text-sm font-medium">Select an office to view its live floor plan</p>
                    <p className="max-w-xs text-xs text-muted-foreground">
                      Each office has zones; employee dots move as people walk around with their phones.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-4.5 w-4.5 text-primary" />
                  On-site presence
                  <Badge variant="muted" className="ml-1">{presence.length}</Badge>
                </CardTitle>
                <CardDescription>Everyone sharing live location from the mobile app.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {presenceLoading ? (
                  <div className="space-y-2 p-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : presence.length === 0 ? (
                  <EmptyState
                    icon={<DoorOpen className="h-5 w-5" />}
                    title="Nobody here right now"
                    description="When employees enter an office geofence, they appear here automatically."
                  />
                ) : (
                  <div className="divide-y divide-border/60">
                    {presence.slice(0, 24).map((p) => (
                      <div key={p.employeeId} className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-muted/40">
                        <button
                          type="button"
                          className="flex min-w-0 flex-1 items-center gap-3 text-left"
                          onClick={() => setDetailTarget(p)}
                        >
                          <span className="relative">
                            <Avatar name={p.employeeName} className="h-8 w-8" />
                            <span
                              className={cn(
                                "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-card",
                                p.status === "on_site" ? "bg-success" : p.status === "en_route" ? "bg-warning" : "bg-muted-foreground/40",
                              )}
                            />
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-[13px] font-medium">{p.employeeName}</span>
                            <span className="block truncate text-[11px] text-muted-foreground">
                              {p.status === "on_site"
                                ? `${p.zoneName ?? "On site"} · ${p.locationName}`
                                : p.status === "en_route"
                                  ? `Heading to ${p.locationName ?? "office"}`
                                  : "Off site"}
                            </span>
                          </span>
                        </button>
                        <span className="hidden text-right sm:block">
                          <span className="block text-[11px] tabular text-muted-foreground">
                            ping {formatTime(p.lastPingAt)}
                          </span>
                          <span className="block text-[10px] text-muted-foreground">
                            {p.source.replace("_", " ")} · ±{p.accuracyM}m
                          </span>
                        </span>
                        {!p.sharingEnabled && <Badge variant="muted">paused</Badge>}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleSharing.mutate({ employeeId: p.employeeId, enabled: !p.sharingEnabled })}
                          disabled={toggleSharing.isPending}
                        >
                          {toggleSharing.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                          {p.sharingEnabled ? "Pause" : "Resume"}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      <LocationFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        location={editTarget}
      />
      <DeleteLocationDialog location={deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)} />
      <PresenceDetailDialog presence={detailTarget} onClose={() => setDetailTarget(null)} />
    </div>
  );
}
