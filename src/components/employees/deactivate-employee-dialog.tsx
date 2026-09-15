"use client";

import { useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useDeactivateEmployee } from "@/hooks/use-queries";
import type { Employee } from "@/types";

interface Props {
  employee: Employee | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeactivateEmployeeDialog({ employee, open, onOpenChange }: Props) {
  const deactivate = useDeactivateEmployee();
  const [confirmText, setConfirmText] = useState("");

  const handleDeactivate = async () => {
    if (!employee) return;
    await deactivate.mutateAsync(employee.id);
    setConfirmText("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) setConfirmText(""); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10">
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </div>
          <DialogTitle>Deactivate {employee?.name}?</DialogTitle>
          <DialogDescription>
            Access will be revoked immediately and they'll be removed from active shift
            assignments. Attendance history is preserved for compliance.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <label className="text-[13px] font-medium">
            Type <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">DEACTIVATE</span> to confirm
          </label>
          <input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="DEACTIVATE"
            className="h-9 w-full rounded-md border border-input bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-destructive/40"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={confirmText !== "DEACTIVATE" || deactivate.isPending}
            onClick={() => void handleDeactivate()}
          >
            {deactivate.isPending && <Loader2 className="animate-spin" />}
            Deactivate employee
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
