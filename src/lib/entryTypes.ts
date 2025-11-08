// src/lib/entryTypes.ts

export type Area = {
  id: string;
  name: string;
  mapPath: string;                 // data URL or /maps/*.png
  category?: "CTMT" | "RHR";       // new: distinguishes which page shows it
  elevation?: string;
<<<<<<< HEAD
=======
  mapPath: string;
  category?: "CTMT" | "RHR";
  doseRate_mrem_hr?: number;
  contamination_cpm?: number;
  hfc?: string;
  notes?: string;
>>>>>>> origin/codex/implement-ctmt-and-rhr-maps-flow-x31wew
};

export type EntryStatus = "entry_pending" | "no_action" | "complete";

export type EntryRecord = {
  id: string;
  timestamp: string;
  areaId: string;
  areaName: string;
  spotX?: number;
  spotY?: number;
  mapSnapshotDataUrl?: string;
  badges: string[];
  workOrder: string;
  status: EntryStatus;
};