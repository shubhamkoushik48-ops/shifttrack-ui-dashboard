"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, MapPin } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useCreateLocation, useUpdateLocation } from "@/hooks/use-queries";
import { TIMEZONES } from "@/constants";
import type { BusinessLocation } from "@/types";

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  address: z.string().min(5, "Address is required"),
  timezone: z.string().min(1),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  geofenceRadiusM: z.coerce.number().min(30).max(2000),
  capacity: z.coerce.number().min(1).max(10000),
  isHeadquarters: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  location?: BusinessLocation | null;
}

export function LocationFormDialog({ open, onOpenChange, location }: Props) {
  const isEdit = !!location;
  const create = useCreateLocation();
  const update = useUpdateLocation();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      address: "",
      timezone: "America/New_York",
      latitude: 40.7484,
      longitude: -73.9857,
      geofenceRadiusM: 150,
      capacity: 40,
      isHeadquarters: false,
    },
  });

  useEffect(() => {
    if (open) {
      reset(
        location
          ? {
              name: location.name,
              address: location.address,
              timezone: location.timezone,
              latitude: location.latitude,
              longitude: location.longitude,
              geofenceRadiusM: location.geofenceRadiusM,
              capacity: location.capacity,
              isHeadquarters: location.isHeadquarters,
            }
          : {
              name: "",
              address: "",
              timezone: "America/New_York",
              latitude: 40.7484,
              longitude: -73.9857,
              geofenceRadiusM: 150,
              capacity: 40,
              isHeadquarters: false,
            },
      );
    }
  }, [open, location, reset]);

  const isHQ = watch("isHeadquarters");

  const onSubmit = (values: FormValues) => {
    if (isEdit && location) {
      update.mutate({ id: location.id, patch: values });
    } else {
      create.mutate(values);
    }
    onOpenChange(false);
  };

  const busy = create.isPending || update.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-4.5 w-4.5 text-primary" />
            {isEdit ? "Edit office" : "Add office"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the office profile, geofence radius and capacity."
              : "Add a new office. Employees who enter its geofence are auto checked in."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="loc-name">Office name</Label>
            <Input id="loc-name" placeholder="e.g. Singapore Office" {...register("name")} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="loc-address">Street address</Label>
            <Input id="loc-address" placeholder="Building, street, city" {...register("address")} />
            {errors.address && <p className="text-xs text-destructive">{errors.address.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="loc-lat">Latitude</Label>
              <Input id="loc-lat" type="number" step="any" {...register("latitude")} />
              {errors.latitude && <p className="text-xs text-destructive">{errors.latitude.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="loc-lng">Longitude</Label>
              <Input id="loc-lng" type="number" step="any" {...register("longitude")} />
              {errors.longitude && <p className="text-xs text-destructive">{errors.longitude.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="loc-radius">Geofence radius (m)</Label>
              <Input id="loc-radius" type="number" {...register("geofenceRadiusM")} />
              {errors.geofenceRadiusM && <p className="text-xs text-destructive">{errors.geofenceRadiusM.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="loc-capacity">Capacity</Label>
              <Input id="loc-capacity" type="number" {...register("capacity")} />
              {errors.capacity && <p className="text-xs text-destructive">{errors.capacity.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="loc-tz">Timezone</Label>
            <select
              id="loc-tz"
              className="flex h-9 w-full rounded-lg border border-input bg-card px-3 text-sm shadow-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
              {...register("timezone")}
            >
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between rounded-xl border p-3">
            <div>
              <p className="text-[13px] font-medium">Headquarters</p>
              <p className="text-[11px] text-muted-foreground">Mark this as the company HQ{isHQ ? "" : " (replaces the current one)"}</p>
            </div>
            <Switch
              checked={isHQ}
              onCheckedChange={(v) => setValue("isHeadquarters", v)}
              aria-label="Headquarters"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="gradient" disabled={busy}>
              {busy && <Loader2 className="animate-spin" />}
              {isEdit ? "Save changes" : "Add office"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
