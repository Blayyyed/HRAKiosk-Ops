// src/lib/entryTypes.ts

// Area records stored in Dexie. category distinguishes which gallery shows the map.
export type Area = {
  id: string;
  name: string;
  category?: "CTMT" | "RHR";
  mapPath: string; // data URL or /maps/* from public
  ctmtId?: string;
  flags?: {
    needsInterlocksBrief?: boolean;
    tempShielding?: boolean;
    respProtectionZone?: boolean;
  };
};

// Lifecycle for operator submissions
export type EntryStatus =
  | "entry_pending"
  | "ready"
  | "briefed"
  | "entered"
  | "denied";

// Saved operator submission. Some fields are optional depending on flow.
export type EntryRecord = {
  id: string;
  areaId: string;
  areaName: string;
  spX: number;
  spY: number;
  status: EntryStatus;
  badges: string[];
  timestamp: string;
  notes?: string;
  workOrder?: string;

  // Existing optional metadata retained for downstream workflows.
  mapSnapshotDataUrl?: string;
  overheadNeeded?: boolean;
  overheadHeight?: string;
  acks?: {
    rwp: boolean;
    briefed: boolean;
    dose: boolean;
    onlyAreasBriefed: boolean;
  };
  exportedAt?: string;
};

// Small type guards if you want to filter quickly
export const isCTMT = (a: Area): boolean => (a.category || "CTMT") === "CTMT";
export const isRHR = (a: Area): boolean => a.category === "RHR";
