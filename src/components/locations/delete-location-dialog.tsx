"use client";

import { useEffect, useState } from "react";
import { Loader2, TriangleAlert } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDeleteLocation } from "@/hooks/use-queries";
import type { BusinessLocation } from "@/types";

interface Props {
  location: BusinessLocation | null;
  onOpenChange: (open: boolean) => void;
}

export function DeleteLocationDialog({ location, onOpenChange }: Props) {
  const [confirm, setConfirm] = useState("");
  const remove = useDeleteLocation();

  useEffect(() => {
    if (!location) setConfirm("");
  }, [location]);

  if (!location) return null;
  const ready = confirm === location.name;

  return (
    <Dialog open={!!location} onOpenChange={(v) => !v && onOpenChange(false)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <TriangleAlert className="h-4.5 w-4.5" />
            Remove office
          </DialogTitle>
          <DialogDescription>
            This permanently removes <span className="font-semibold text-foreground">{location.name}</span> and ends
            live tracking for everyone checked in there. Attendance history is kept.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5">
          <p className="text-[13px] text-muted-foreground">
            Type <span className="font-semibold text-foreground">{location.name}</span> to confirm.
          </p>
          <Input value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder={location.name} />
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={!ready || remove.isPending}
            onClick={() =>
              remove.mutate(location.id, {
                onSettled: () => onOpenChange(false),
              })
            }
          >
            {remove.isPending && <Loader2 className="animate-spin" />}
            Remove office
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
