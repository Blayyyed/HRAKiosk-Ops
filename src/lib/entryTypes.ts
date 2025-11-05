// src/lib/entryTypes.ts
export type Area = {
  id: string;
  name: string;
  mapPath: string;                 // data URL or /maps/*.png
  category?: "CTMT" | "RHR";       // new: distinguishes which page shows it
  elevation?: string;
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