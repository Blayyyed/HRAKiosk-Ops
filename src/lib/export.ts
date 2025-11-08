// src/lib/export.ts
import type { EntryRecord } from "./entryTypes";

const CSV_HEADERS = [
  "id",
  "timestamp",
  "areaId",
  "areaName",
  "status",
  "badgesMasked",
  "workOrder",
  "leadBadge",
  "planningNote",
  "exportedAt",
];

const csvEscape = (value: string): string => {
  if (value.includes(",") || value.includes("\n") || value.includes("\"")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
};

export function toCSV(entries: EntryRecord[]): string {
  const rows = entries.map((entry) => [
    entry.id,
    entry.timestamp,
    entry.areaId,
    entry.areaName,
    entry.status,
    (entry.badgesMasked || []).join(" "),
    entry.workOrder ?? "",
    entry.leadBadge ?? "",
    entry.planningNote ?? "",
    entry.exportedAt ?? "",
  ]);

  const allRows = [CSV_HEADERS, ...rows];
  return allRows.map((row) => row.map((cell) => csvEscape(cell)).join(",")).join("\n");
}

export function downloadFile(filename: string, data: string, mime: string): void {
  const blob = new Blob([data], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
