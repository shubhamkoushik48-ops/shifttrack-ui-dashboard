"use client";

import { useMemo, useState } from "react";
import { Plus, SlidersHorizontal, Download, UserCog } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/dashboard/attendance-status-badge";
import { DataTable, type Column, type DataTableQuery } from "@/components/shared/data-table";
import { EmployeeFormDialog } from "@/components/employees/employee-form-dialog";
import { EmployeeProfileDrawer } from "@/components/employees/employee-profile-drawer";
import { DeactivateEmployeeDialog } from "@/components/employees/deactivate-employee-dialog";
import { useEmployees } from "@/hooks/use-queries";
import { useUiStore } from "@/store/ui-store";
import type { Employee } from "@/types";
import { EMPLOYEE_STATUS_OPTIONS, DEPARTMENTS } from "@/constants";
import { toast } from "sonner";

export default function EmployeesPage() {
  const [query, setQuery] = useState<Omit<DataTableQuery, "search" | "sortBy" | "sortDir"> & {
    search: string;
    sortBy: string;
    sortDir: "asc" | "desc";
    department: string;
    status: string;
  }>({
    page: 1,
    pageSize: 10,
    search: "",
    sortBy: "name",
    sortDir: "asc",
    department: "all",
    status: "all",
  });
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [drawerEmployee, setDrawerEmployee] = useState<Employee | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<Employee | null>(null);
  const pushNotification = useUiStore((s) => s.pushNotification);

  const { data, isLoading, isError, refetch } = useEmployees({
    page: query.page,
    pageSize: query.pageSize,
    search: query.search,
    department: query.department,
    status: query.status,
    sortBy: query.search === "" ? query.sortBy : "name",
    sortDir: query.sortDir,
  });

  const onQueryChange = (patch: Partial<typeof query>) => setQuery((q) => ({ ...q, ...patch }));

  const columns: Column<Employee>[] = useMemo(
    () => [
      {
        key: "name",
        header: "Employee",
        sortable: true,
        render: (row) => (
          <div className="flex items-center gap-3">
            <Avatar name={row.name} />
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold">{row.name}</p>
              <p className="truncate text-[11px] text-muted-foreground">{row.employeeCode}</p>
            </div>
          </div>
        ),
      },
      {
        key: "department",
        header: "Department",
        sortable: true,
        hideBelow: "lg",
        render: (row) => <span className="text-[13px]">{row.department}</span>,
      },
      {
        key: "designation",
        header: "Designation",
        hideBelow: "md",
        render: (row) => <span className="text-[13px] text-muted-foreground">{row.designation}</span>,
      },
      {
        key: "email",
        header: "Email",
        hideBelow: "lg",
        render: (row) => <span className="text-[13px] text-muted-foreground">{row.email}</span>,
      },
      {
        key: "phone",
        header: "Phone",
        hideBelow: "lg",
        render: (row) => <span className="text-[13px] tabular text-muted-foreground">{row.phone}</span>,
      },
      {
        key: "status",
        header: "Status",
        sortable: true,
        render: (row) => <StatusBadge status={row.status} />,
      },
      {
        key: "actions",
        header: "",
        className: "w-10 text-right",
        render: (row) => <RowActions row={row} onEdit={setEditing} onDeactivate={setDeactivateTarget} onOpenProfile={setDrawerEmployee} />,
      },
    ],
    [],
  );

  const handleExport = () => {
    const rows = data?.data ?? [];
    const csv = [
      "Employee ID,Name,Department,Designation,Email,Phone,Status",
      ...rows.map((r) => `${r.employeeCode},${r.name},${r.department},${r.designation},${r.email},${r.phone},${r.status}`),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "employees.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${rows.length} employees to CSV`);
    pushNotification({
      title: "Employee export ready",
      body: `${rows.length} records exported to CSV.`,
      tone: "success",
    });
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Employees"
        description="Manage your workforce, departments and designations."
        actions={
          <>
            <Button variant="outline" onClick={handleExport}>
              <Download /> Export CSV
            </Button>
            <Button
              variant="gradient"
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Plus /> Add employee
            </Button>
          </>
        }
      />

      <Card className="p-4 sm:p-5">
        <DataTable
          columns={columns}
          rows={data?.data ?? []}
          total={data?.total}
          query={query}
          onQueryChange={onQueryChange}
          isLoading={isLoading}
          isError={isError}
          onRetry={() => void refetch()}
          searchPlaceholder="Search name, email, code…"
          rowKey={(row) => row.id}
          onRowClick={setDrawerEmployee}
          mobileCard={(row) => (
            <div className="rounded-xl border bg-card p-3 shadow-soft" onClick={() => setDrawerEmployee(row)}>
              <div className="flex items-center gap-3">
                <Avatar name={row.name} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold">{row.name}</p>
                  <p className="truncate text-[11px] text-muted-foreground">{row.designation}</p>
                </div>
                <StatusBadge status={row.status} />
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>{row.department}</span>
                <span className="tabular">{row.employeeCode}</span>
              </div>
            </div>
          )}
          toolbar={
            <>
              <Select value={query.department} onValueChange={(v) => onQueryChange({ department: v, page: 1 })}>
                <SelectTrigger className="h-9 w-[150px]">
                  <SlidersHorizontal className="mr-1 h-3.5 w-3.5 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All departments</SelectItem>
                  {DEPARTMENTS.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={query.status} onValueChange={(v) => onQueryChange({ status: v, page: 1 })}>
                <SelectTrigger className="h-9 w-[130px]">
                  <UserCog className="mr-1 h-3.5 w-3.5 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {EMPLOYEE_STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          }
          emptyAction={
            <Button variant="outline" size="sm" onClick={() => setFormOpen(true)}>
              <Plus /> Add employee
            </Button>
          }
        />
      </Card>

      <EmployeeFormDialog open={formOpen} onOpenChange={setFormOpen} employee={editing} />
      <EmployeeProfileDrawer
        employee={drawerEmployee}
        open={!!drawerEmployee}
        onOpenChange={(open) => !open && setDrawerEmployee(null)}
        onEdit={(emp) => {
          setDrawerEmployee(null);
          setEditing(emp);
          setFormOpen(true);
        }}
        onDeactivate={(emp) => {
          setDrawerEmployee(null);
          setDeactivateTarget(emp);
        }}
      />
      <DeactivateEmployeeDialog
        employee={deactivateTarget}
        open={!!deactivateTarget}
        onOpenChange={(open) => !open && setDeactivateTarget(null)}
      />
    </div>
  );
}

function RowActions({
  row,
  onEdit,
  onDeactivate,
  onOpenProfile,
}: {
  row: Employee;
  onEdit: (e: Employee) => void;
  onDeactivate: (e: Employee) => void;
  onOpenProfile: (e: Employee) => void;
}) {
  return (
    <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
      <Button variant="ghost" size="icon-sm" title="View profile" onClick={() => onOpenProfile(row)}>
        <UserCog className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon-sm" title="Edit" onClick={() => onEdit(row)}>
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </Button>
      <Button variant="ghost" size="icon-sm" title="Deactivate" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => onDeactivate(row)}>
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </Button>
    </div>
  );
}
