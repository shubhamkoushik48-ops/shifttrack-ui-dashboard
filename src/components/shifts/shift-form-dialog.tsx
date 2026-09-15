"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Search, Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/switch";
import { Avatar } from "@/components/ui/avatar";
import { DAYS_OF_WEEK, DEPARTMENTS, SHIFT_STATUS_OPTIONS } from "@/constants";
import { employeeService, shiftService } from "@/services";
import { useCreateShift, useUpdateShift } from "@/hooks/use-queries";
import { cn } from "@/lib/utils";
import type { Shift } from "@/types";

const shiftSchema = z
  .object({
    name: z.string().min(2, "Shift name is required"),
    startTime: z.string().min(1, "Start time required"),
    endTime: z.string().min(1, "End time required"),
    department: z.string().min(1, "Select department"),
    status: z.enum(["active", "draft", "archived"]),
    days: z.array(z.number()).min(1, "Pick at least one day"),
  })
  .refine((v) => v.startTime !== v.endTime, { message: "Start and end time must differ", path: ["endTime"] });

type ShiftForm = z.infer<typeof shiftSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shift?: Shift | null;
}

export function ShiftFormDialog({ open, onOpenChange, shift }: Props) {
  const isEdit = !!shift;
  const create = useCreateShift();
  const update = useUpdateShift();
  const [employeeOptions, setEmployeeOptions] = useState<{ id: string; name: string; department: string }[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [color, setColor] = useState("#2563EB");
  const [daysError, setDaysError] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ShiftForm>({
    resolver: zodResolver(shiftSchema),
    defaultValues: {
      name: "",
      startTime: "09:00",
      endTime: "17:00",
      department: "Engineering",
      status: "active",
      days: [1, 2, 3, 4, 5],
    },
  });

  useEffect(() => {
    if (!open) return;
    employeeService.list({ page: 1, pageSize: 200 }).then((res) => {
      setEmployeeOptions(res.data.map((e) => ({ id: e.id, name: e.name, department: e.department })));
    });
    if (shift) {
      reset({
        name: shift.name,
        startTime: shift.startTime,
        endTime: shift.endTime,
        department: shift.department,
        status: shift.status,
        days: shift.days,
      });
      setSelected(new Set(shift.assignedEmployeeIds));
      setColor(shift.color);
    } else {
      reset({ name: "", startTime: "09:00", endTime: "17:00", department: "Engineering", status: "active", days: [1, 2, 3, 4, 5] });
      setSelected(new Set());
      setColor("#2563EB");
    }
    setDaysError(false);
  }, [open, shift, reset]);

  const days = watch("days");
  const department = watch("department");
  const status = watch("status");

  const toggleDay = (d: number) => {
    const current = watch("days");
    const next = current.includes(d) ? current.filter((x) => x !== d) : [...current, d];
    setValue("days", next, { shouldValidate: true });
    setDaysError(next.length === 0);
  };

  const toggleEmployee = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const onSubmit = async (values: ShiftForm) => {
    if (selected.size === 0 && !isEdit) {
      // allow empty assignment but warn
    }
    const payload = { ...values, color, assignedEmployeeIds: Array.from(selected) };
    if (isEdit && shift) await update.mutateAsync({ id: shift.id, patch: payload });
    else await create.mutateAsync(payload);
    onOpenChange(false);
  };

  const filtered = employeeOptions.filter(
    (e) => e.name.toLowerCase().includes(search.toLowerCase()) || e.department.toLowerCase().includes(search.toLowerCase()),
  );
  const busy = create.isPending || update.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit shift" : "Create shift"}</DialogTitle>
          <DialogDescription>Define hours, department and assign team members.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="shift-name">Shift name</Label>
              <Input id="shift-name" placeholder="e.g. Morning Shift" {...register("name")} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="shift-start">Start time</Label>
              <Input id="shift-start" type="time" {...register("startTime")} />
              {errors.startTime && <p className="text-xs text-destructive">{errors.startTime.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="shift-end">End time</Label>
              <Input id="shift-end" type="time" {...register("endTime")} />
              {errors.endTime && <p className="text-xs text-destructive">{errors.endTime.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Department</Label>
              <Select value={department} onValueChange={(v) => setValue("department", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setValue("status", v as ShiftForm["status"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SHIFT_STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Days of week</Label>
            <div className="flex flex-wrap gap-1.5">
              {DAYS_OF_WEEK.map((label, idx) => {
                const active = days.includes(idx);
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => toggleDay(idx)}
                    className={cn(
                      "h-8 w-11 rounded-lg border text-xs font-semibold transition-all",
                      active
                        ? "border-primary bg-primary text-primary-foreground shadow-sm"
                        : "bg-card text-muted-foreground hover:border-primary/40",
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            {daysError && <p className="text-xs text-destructive">Pick at least one day</p>}
          </div>

          <div className="space-y-1.5">
            <Label>Accent color</Label>
            <div className="flex gap-2">
              {["#2563EB", "#7C3AED", "#F59E0B", "#22C55E", "#0EA5E9", "#EF4444"].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    "h-8 w-8 rounded-full border-2 transition-transform hover:scale-110",
                    color === c ? "border-foreground ring-2 ring-ring ring-offset-2 ring-offset-background" : "border-transparent",
                  )}
                  style={{ background: c }}
                  aria-label={`Color ${c}`}
                />
              ))}
            </div>
          </div>

          {/* Assignment */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" /> Assigned employees
                <span className="rounded-full bg-primary/10 px-1.5 text-[11px] font-bold text-primary">{selected.size}</span>
              </Label>
            </div>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Filter people…" className="h-8 pl-8 text-xs" />
            </div>
            <div className="max-h-44 space-y-0.5 overflow-y-auto rounded-lg border bg-card p-1">
              {filtered.length === 0 ? (
                <p className="py-4 text-center text-xs text-muted-foreground">No people found</p>
              ) : (
                filtered.map((e) => (
                  <label
                    key={e.id}
                    className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 hover:bg-muted/60"
                  >
                    <Checkbox checked={selected.has(e.id)} onCheckedChange={() => toggleEmployee(e.id)} />
                    <Avatar name={e.name} className="h-6 w-6" />
                    <span className="flex-1 truncate text-[13px]">{e.name}</span>
                    <span className="text-[10px] text-muted-foreground">{e.department}</span>
                  </label>
                ))
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" variant="gradient" disabled={busy}>
              {busy && <Loader2 className="animate-spin" />}
              {isEdit ? "Save changes" : "Create shift"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
