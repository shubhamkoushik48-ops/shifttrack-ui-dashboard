import { makeRng } from "@/lib/rng";
import type { BusinessLocation, Employee, EmployeePresence, OfficeZone } from "@/types";

type ZoneSeed = [name: string, kind: OfficeZone["kind"], x: number, y: number, w: number, h: number];

const ZONE_LAYOUTS: ZoneSeed[][] = [
  // 0 — Open-plan HQ
  [
    ["Engineering Floor", "workspace", 0.04, 0.06, 0.44, 0.4],
    ["Design Studio", "workspace", 0.52, 0.06, 0.24, 0.4],
    ["Boardroom", "meeting", 0.8, 0.06, 0.16, 0.22],
    ["Focus Pods", "focus", 0.8, 0.32, 0.16, 0.14],
    ["Cafeteria", "social", 0.04, 0.52, 0.36, 0.2],
    ["Lounge", "social", 0.44, 0.52, 0.22, 0.2],
    ["Reception", "utility", 0.7, 0.52, 0.26, 0.2],
  ],
  // 1 — Co-working style
  [
    ["Hot Desks", "workspace", 0.05, 0.08, 0.52, 0.34],
    ["Call Booths", "focus", 0.62, 0.08, 0.16, 0.34],
    ["Summit Room", "meeting", 0.82, 0.08, 0.13, 0.18],
    ["Team Bay A", "workspace", 0.05, 0.5, 0.3, 0.22],
    ["Team Bay B", "workspace", 0.39, 0.5, 0.3, 0.22],
    ["Coffee Point", "social", 0.73, 0.5, 0.22, 0.22],
  ],
  // 2 — Support hub
  [
    ["Support Floor", "workspace", 0.06, 0.1, 0.6, 0.36],
    ["War Room", "meeting", 0.7, 0.1, 0.24, 0.16],
    ["Quiet Zone", "focus", 0.7, 0.3, 0.24, 0.16],
    ["Break Area", "social", 0.06, 0.54, 0.34, 0.2],
    ["Ops Desk", "utility", 0.44, 0.54, 0.24, 0.2],
  ],
];

function buildZones(seedIndex: number): OfficeZone[] {
  const layout = ZONE_LAYOUTS[seedIndex % ZONE_LAYOUTS.length]!;
  return layout.map(([name, kind, x, y, w, h], i) => ({
    id: `zone_${seedIndex}_${i}`,
    name,
    kind,
    x,
    y,
    w,
    h,
  }));
}

export function generateLocations(): BusinessLocation[] {
  return [
    {
      id: "loc_001",
      name: "New York HQ",
      address: "350 Fifth Avenue, Floor 21, New York, NY 10118",
      timezone: "America/New_York",
      latitude: 40.7484,
      longitude: -73.9857,
      geofenceRadiusM: 150,
      isHeadquarters: true,
      isOpen: true,
      manager: "Maya Okafor",
      capacity: 120,
      zones: buildZones(0),
      createdAt: "2021-03-01T09:00:00.000Z",
    },
    {
      id: "loc_002",
      name: "Austin Office",
      address: "600 Congress Ave, Austin, TX 78701",
      timezone: "America/Chicago",
      latitude: 30.2672,
      longitude: -97.7431,
      geofenceRadiusM: 120,
      isHeadquarters: false,
      isOpen: true,
      manager: "Daniel Reyes",
      capacity: 64,
      zones: buildZones(1),
      createdAt: "2022-06-15T09:00:00.000Z",
    },
    {
      id: "loc_003",
      name: "London Office",
      address: "1 Canada Square, Canary Wharf, London E14 5AB",
      timezone: "Europe/London",
      latitude: 51.5054,
      longitude: -0.0235,
      geofenceRadiusM: 200,
      isHeadquarters: false,
      isOpen: true,
      manager: "Priya Sharma",
      capacity: 48,
      zones: buildZones(2),
      createdAt: "2023-01-10T09:00:00.000Z",
    },
    {
      id: "loc_004",
      name: "Berlin Office",
      address: "Friedrichstraße 68, 10117 Berlin",
      timezone: "Europe/Berlin",
      latitude: 52.5246,
      longitude: 13.3876,
      geofenceRadiusM: 100,
      isHeadquarters: false,
      isOpen: false,
      manager: "Jonas Weber",
      capacity: 32,
      zones: buildZones(1),
      createdAt: "2023-09-01T09:00:00.000Z",
    },
  ];
}

export function generatePresence(employees: Employee[]): EmployeePresence[] {
  const rng = makeRng(1337);
  const active = employees.filter((e) => e.status === "active");
  const openLocations = generateLocations().filter((l) => l.isOpen);
  const out: EmployeePresence[] = [];

  for (const emp of active) {
    const roll = rng.next();
    // 58% on site, 14% en route, 28% checked out
    const status: EmployeePresence["status"] = roll < 0.58 ? "on_site" : roll < 0.72 ? "en_route" : "checked_out";

    const loc =
      status === "checked_out"
        ? rng.chance(0.4)
          ? rng.pick(openLocations)
          : null
        : rng.pick(openLocations);

    const zone =
      loc && status === "on_site" ? rng.pick(loc.zones) : null;

    const pos =
      loc && zone
        ? {
            x: Math.min(0.96, Math.max(0.04, zone.x + 0.06 + rng.next() * (zone.w - 0.12))),
            y: Math.min(0.96, Math.max(0.04, zone.y + 0.06 + rng.next() * (zone.h - 0.12))),
          }
        : null;

    const lastPing = new Date(Date.now() - rng.int(10, 240) * 1000);
    const arrived = status !== "checked_out" ? new Date(Date.now() - rng.int(30, 300) * 60000).toISOString() : null;

    out.push({
      id: `pres_${emp.id}`,
      employeeId: emp.id,
      employeeName: emp.name,
      department: emp.department,
      avatarSeed: emp.name,
      locationId: loc?.id ?? null,
      locationName: loc?.name ?? null,
      zoneId: zone?.id ?? null,
      zoneName: zone?.name ?? null,
      status,
      x: pos?.x ?? null,
      y: pos?.y ?? null,
      source: rng.chance(0.78) ? "phone_gps" : rng.chance(0.6) ? "wifi" : "beacon",
      accuracyM: rng.int(3, 25),
      batteryPct: rng.chance(0.85) ? rng.int(8, 100) : null,
      sharingEnabled: rng.chance(0.88),
      lastPingAt: lastPing.toISOString(),
      arrivedAt: arrived,
    });
  }
  return out;
}
