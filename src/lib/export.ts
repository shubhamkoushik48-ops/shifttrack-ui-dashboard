"use client";

import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";

export interface ExportColumn {
  key: string;
  header: string;
}

function toAoa(rows: Record<string, unknown>[], columns: ExportColumn[]): (string | number)[][] {
  return [
    columns.map((c) => c.header),
    ...rows.map((r) => columns.map((c) => String(r[c.key] ?? ""))),
  ];
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportCSV(rows: Record<string, unknown>[], columns: ExportColumn[], filename: string) {
  const aoa = toAoa(rows, columns);
  const csv = aoa
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  downloadBlob(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" }), `${filename}.csv`);
}

export function exportExcel(rows: Record<string, unknown>[], columns: ExportColumn[], filename: string) {
  const ws = XLSX.utils.aoa_to_sheet(toAoa(rows, columns));
  ws["!cols"] = columns.map((c) => ({ wch: Math.max(c.header.length + 4, 16) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Report");
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export function exportPDF(
  title: string,
  subtitle: string,
  rows: Record<string, unknown>[],
  columns: ExportColumn[],
  filename: string,
) {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header band
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, pageWidth, 64, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("ShiftTrack", 40, 28);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`${title} — ${subtitle}`, 40, 46);

  // Summary block
  let y = 92;
  doc.setTextColor(30, 41, 59);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(title, 40, y);
  y += 18;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(subtitle, 40, y);
  y += 24;

  // Table
  const colWidth = (pageWidth - 80) / columns.length;
  doc.setTextColor(30, 41, 59);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  columns.forEach((c, i) => doc.text(c.header, 40 + i * colWidth, y));
  y += 6;
  doc.setDrawColor(226, 232, 240);
  doc.line(40, y, pageWidth - 40, y);
  y += 14;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const maxRows = 28;
  rows.slice(0, maxRows).forEach((row) => {
    columns.forEach((c, i) => {
      const text = String(row[c.key] ?? "");
      doc.setTextColor(51, 65, 85);
      doc.text(text.length > 28 ? text.slice(0, 27) + "…" : text, 40 + i * colWidth, y);
    });
    y += 16;
    if (y > 540) {
      doc.addPage();
      y = 60;
    }
  });

  if (rows.length > maxRows) {
    doc.setTextColor(148, 163, 184);
    doc.text(`+ ${rows.length - maxRows} more rows — export to CSV/Excel for the full dataset.`, 40, y);
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Generated ${new Date().toLocaleString()} · ShiftTrack Reports · Page ${i}/${pageCount}`,
      40,
      doc.internal.pageSize.getHeight() - 18,
    );
  }

  doc.save(`${filename}.pdf`);
}
