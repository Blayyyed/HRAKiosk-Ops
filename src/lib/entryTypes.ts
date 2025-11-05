// src/lib/entryTypes.ts
export type Area = {
  id: string;
  name: string;
  mapPath: string;
  category?: "CTMT" | "RHR";
  elevation?: string;
  doseRate_mrem_hr?: number;
  contamination_cpm?: number;
  hfc?: string;
  notes?: string;
};

export type EntryStatus = "entry_pending" | "no_action" | "complete";

export type EntryRecord = {
  id: string;
  timestamp: string;
  areaId: string;
  areaName: string;
  spotX: number;
  spotY: number;
  mapSnapshotDataUrl?: string;
  badges: string[];
  workOrder: string;
  status: EntryStatus;
};
