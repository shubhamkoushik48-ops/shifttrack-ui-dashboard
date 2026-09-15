"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
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
import { DEPARTMENTS, DESIGNATIONS, LOCATIONS, EMPLOYEE_STATUS_OPTIONS, EMPLOYMENT_TYPES } from "@/constants";
import { useCreateEmployee, useUpdateEmployee } from "@/hooks/use-queries";
import type { Employee } from "@/types";

const employeeSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().min(7, "Enter a valid phone number"),
  department: z.string().min(1, "Select a department"),
  designation: z.string().min(1, "Select a designation"),
  status: z.enum(["active", "on_leave", "suspended", "inactive"]),
  employmentType: z.enum(["full_time", "part_time", "contract", "intern"]),
  location: z.string().min(1, "Select a location"),
});

type EmployeeForm = z.infer<typeof employeeSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee?: Employee | null;
}

export function EmployeeFormDialog({ open, onOpenChange, employee }: Props) {
  const isEdit = !!employee;
  const create = useCreateEmployee();
  const update = useUpdateEmployee();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EmployeeForm>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      department: "Engineering",
      designation: "Software Engineer",
      status: "active",
      employmentType: "full_time",
      location: "New York HQ",
    },
  });

  useEffect(() => {
    if (open) {
      reset(
        employee
          ? {
              name: employee.name,
              email: employee.email,
              phone: employee.phone,
              department: employee.department,
              designation: employee.designation,
              status: employee.status,
              employmentType: employee.employmentType,
              location: employee.location,
            }
          : {
              name: "",
              email: "",
              phone: "",
              department: "Engineering",
              designation: "Software Engineer",
              status: "active",
              employmentType: "full_time",
              location: "New York HQ",
            },
      );
    }
  }, [open, employee, reset]);

  const department = watch("department");
  const status = watch("status");
  const employmentType = watch("employmentType");
  const designation = watch("designation");

  const onSubmit = async (values: EmployeeForm) => {
    if (isEdit && employee) {
      await update.mutateAsync({ id: employee.id, patch: values });
    } else {
      await create.mutateAsync(values);
    }
    onOpenChange(false);
  };

  const busy = create.isPending || update.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit employee" : "Add new employee"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update the team member's details below." : "They'll receive an invite email with onboarding steps."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 sm:grid-cols-2" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="emp-name">Full name</Label>
            <Input id="emp-name" placeholder="Jane Cooper" {...register("name")} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="emp-email">Email</Label>
            <Input id="emp-email" type="email" placeholder="jane@company.com" {...register("email")} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="emp-phone">Phone</Label>
            <Input id="emp-phone" placeholder="+1 (555) 000-1234" {...register("phone")} />
            {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Department</Label>
            <Select value={department} onValueChange={(v) => { setValue("department", v); setValue("designation", DESIGNATIONS[v]?.[0] ?? "Specialist"); }}>
              <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
              <SelectContent>
                {DEPARTMENTS.map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Designation</Label>
            <Select value={designation} onValueChange={(v) => setValue("designation", v)}>
              <SelectTrigger><SelectValue placeholder="Select designation" /></SelectTrigger>
              <SelectContent>
                {(DESIGNATIONS[department] ?? ["Specialist"]).map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Location</Label>
            <Select value={watch("location")} onValueChange={(v) => setValue("location", v)}>
              <SelectTrigger><SelectValue placeholder="Select location" /></SelectTrigger>
              <SelectContent>
                {LOCATIONS.map((l) => (
                  <SelectItem key={l} value={l}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setValue("status", v as EmployeeForm["status"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {EMPLOYEE_STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Employment type</Label>
            <Select value={employmentType} onValueChange={(v) => setValue("employmentType", v as EmployeeForm["employmentType"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {EMPLOYMENT_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="col-span-full mt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="gradient" disabled={busy}>
              {busy && <Loader2 className="animate-spin" />}
              {isEdit ? "Save changes" : "Add employee"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
