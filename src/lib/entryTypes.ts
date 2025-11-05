// src/lib/entryTypes.ts
export type Area = {
  id: string;
  name: string;
  elevation?: string;
  mapPath: string;
  category?: "CTMT" | "RHR";
  doseRate_mrem_hr?: number;
  contamination_cpm?: number;
  hfc?: string;
  notes?: string;
};

export type EntryStatus = "entry_pending" | "closed";

export type EntryRecord = {
  id: string;
  timestamp: string;
  areaId: string;
  areaName: string;
  // map pin position (0..1) relative
  spotX: number;
  spotY: number;
  // optional snapshot of the map with pin
  mapSnapshotDataUrl?: string;

  // 🔹 Multiple badges now supported
  badges: string[];

  // work order (string)
  workOrder: string;

  // overhead info (optional)
  overheadNeeded?: boolean;
  overheadHeight?: string;

  status: EntryStatus;
};
