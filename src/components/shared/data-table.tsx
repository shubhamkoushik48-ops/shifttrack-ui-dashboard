"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton, EmptyState, ErrorState } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export interface DataTableQuery {
  page: number;
  pageSize: number;
  search: string;
  sortBy: string;
  sortDir: "asc" | "desc";
}

export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  className?: string;
  headerClassName?: string;
  render: (row: T) => React.ReactNode;
  sortValue?: (row: T) => string | number;
  hideBelow?: "sm" | "md" | "lg";
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  total?: number;
  query: DataTableQuery;
  onQueryChange: (patch: Partial<DataTableQuery>) => void;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  searchPlaceholder?: string;
  toolbar?: React.ReactNode;
  onRowClick?: (row: T) => void;
  rowKey: (row: T) => string;
  mobileCard?: (row: T) => React.ReactNode;
}

const HIDE_CLASS: Record<string, string> = {
  sm: "hidden sm:table-cell",
  md: "hidden md:table-cell",
  lg: "hidden lg:table-cell",
};

export function DataTable<T>({
  columns,
  rows,
  total,
  query,
  onQueryChange,
  isLoading,
  isError,
  onRetry,
  emptyTitle = "Nothing here yet",
  emptyDescription,
  emptyAction,
  searchPlaceholder = "Search…",
  toolbar,
  onRowClick,
  rowKey,
  mobileCard,
}: DataTableProps<T>) {
  const [searchInput, setSearchInput] = React.useState(query.search);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  React.useEffect(() => {
    setSearchInput(query.search);
  }, [query.search]);

  const handleSearch = (value: string) => {
    setSearchInput(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onQueryChange({ search: value, page: 1 });
    }, 350);
  };

  const toggleSort = (col: Column<T>) => {
    if (!col.sortable) return;
    const dir = query.sortBy === col.key && query.sortDir === "asc" ? "desc" : "asc";
    onQueryChange({ sortBy: col.key, sortDir: dir, page: 1 });
  };

  const totalPages = Math.max(1, Math.ceil((total ?? rows.length) / query.pageSize));
  const start = (query.page - 1) * query.pageSize + 1;
  const end = Math.min(query.page * query.pageSize, total ?? rows.length);
  const hasFilters = query.search !== "";

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Input
            value={searchInput}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder={searchPlaceholder}
            className="h-9 pl-8"
          />
          <svg
            className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        {toolbar ? <div className="flex flex-wrap items-center gap-2">{toolbar}</div> : null}
      </div>

      {/* Error */}
      {isError ? (
        <div className="rounded-xl border bg-card">
          <ErrorState onRetry={onRetry} />
        </div>
      ) : isLoading && rows.length === 0 ? (
        /* Loading skeleton rows */
        <div className="overflow-hidden rounded-xl border bg-card">
          <div className="space-y-0">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 border-b border-border/60 px-4 py-3.5 last:border-0">
                <Skeleton className="h-9 w-9 rounded-full" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="hidden h-4 w-28 sm:block" />
                <Skeleton className="hidden h-4 w-20 md:block" />
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border bg-card">
          <EmptyState
            icon={<Inbox className="h-5 w-5" />}
            title={hasFilters ? "No matches found" : emptyTitle}
            description={hasFilters ? "Try adjusting your search or filters." : emptyDescription}
            action={emptyAction}
          />
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-xl border bg-card shadow-soft md:block">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  {columns.map((col) => (
                    <TableHead key={col.key} className={cn(col.headerClassName, col.hideBelow && HIDE_CLASS[col.hideBelow])}>
                      {col.sortable ? (
                        <button
                          type="button"
                          onClick={() => toggleSort(col)}
                          className="flex items-center gap-1 uppercase tracking-wider hover:text-foreground"
                        >
                          {col.header}
                          {query.sortBy === col.key ? (
                            query.sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                          ) : (
                            <ArrowUpDown className="h-3 w-3 opacity-40" />
                          )}
                        </button>
                      ) : (
                        col.header
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading
                  ? rows.map((row) => (
                      <TableRow key={rowKey(row)}>
                        <TableCell colSpan={columns.length}>
                          <Skeleton className="h-5 w-full" />
                        </TableCell>
                      </TableRow>
                    ))
                  : rows.map((row, i) => (
                      <motion.tr
                        key={rowKey(row)}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: Math.min(i * 0.02, 0.2) }}
                        className={cn(
                          "border-b border-border/60 transition-colors last:border-0 hover:bg-muted/40",
                          onRowClick && "cursor-pointer",
                        )}
                        onClick={() => onRowClick?.(row)}
                      >
                        {columns.map((col) => (
                          <TableCell key={col.key} className={cn(col.className, col.hideBelow && HIDE_CLASS[col.hideBelow])}>
                            {col.render(row)}
                          </TableCell>
                        ))}
                      </motion.tr>
                    ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile cards */}
          <div className="space-y-2 md:hidden">
            {rows.map((row) =>
              mobileCard ? (
                <div key={rowKey(row)} onClick={() => onRowClick?.(row)}>
                  {mobileCard(row)}
                </div>
              ) : (
                <div
                  key={rowKey(row)}
                  onClick={() => onRowClick?.(row)}
                  className="rounded-xl border bg-card p-3 shadow-soft"
                >
                  {columns
                    .filter((c) => !c.hideBelow)
                    .map((c) => (
                      <div key={c.key} className="flex items-center justify-between gap-3 py-1 text-[13px]">
                        <span className="text-muted-foreground">{c.header}</span>
                        <span className="text-right font-medium">{c.render(row)}</span>
                      </div>
                    ))}
                </div>
              ),
            )}
          </div>

          {/* Pagination */}
          <div className="flex flex-col items-center justify-between gap-3 pt-1 sm:flex-row">
            <p className="text-xs text-muted-foreground">
              Showing <span className="font-semibold text-foreground">{start}</span>–
              <span className="font-semibold text-foreground">{end}</span> of{" "}
              <span className="font-semibold text-foreground">{total ?? rows.length}</span>
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={query.page <= 1}
                onClick={() => onQueryChange({ page: query.page - 1 })}
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Prev
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages })
                  .slice(0, 7)
                  .map((_, i) => {
                    const p = i + 1;
                    const isCurrent = p === query.page;
                    return (
                      <Button
                        key={p}
                        variant={isCurrent ? "default" : "ghost"}
                        size="icon-sm"
                        className={cn("text-xs", isCurrent && "pointer-events-none")}
                        onClick={() => onQueryChange({ page: p })}
                      >
                        {p}
                      </Button>
                    );
                  })}
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={query.page >= totalPages}
                onClick={() => onQueryChange({ page: query.page + 1 })}
              >
                Next <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
