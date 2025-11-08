// src/lib/entryTypes.ts

// Area records stored in Dexie. category distinguishes which gallery shows the map.
export type Area = {
  id: string;
  name: string;
  category?: "CTMT" | "RHR";
  mapPath: string; // data URL or /maps/* from public
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
  timestamp: string;

  areaId: string;
  areaName: string;

  // Optional for CTMT/RHR scroll submissions without a specific pin
  spotX?: number;
  spotY?: number;

  // Canvas snapshot (if a pin was placed on a map)
  mapSnapshotDataUrl?: string;

  // Optional metadata used in later workflows (kept optional for compatibility)
  badgesMasked?: string[];  // e.g., ["****31314", "****32412"]
  badgesHashed?: string[];  // sha-256 hex, if you implement hashing later
  leadBadge?: string;
  workOrder?: string;
  planningNote?: string;

  // Required confirm checks from Acknowledge page (present if that page was used)
  acks?: {
    rwp: boolean;
    briefed: boolean;
    dose: boolean;
    onlyAreasBriefed: boolean;
  };

  status: EntryStatus;
  exportedAt?: string; // set when exporting/purging
};

// Small type guards if you want to filter quickly
export const isCTMT = (a: Area): boolean => (a.category || "CTMT") === "CTMT";
export const isRHR = (a: Area): boolean => a.category === "RHR";
