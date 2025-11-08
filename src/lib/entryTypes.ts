// src/lib/entryTypes.ts

export type Area = {
  id: string;
  name: string;
  category: "CTMT" | "RHR";
  mapPath: string;
  flags?: {
    needsInterlocksBrief?: boolean;
    tempShielding?: boolean;
    respProtectionZone?: boolean;
  };
};

export type EntryRecord = {
  id: string;
  timestamp: string;
  areaId: string;
  areaName: string;
  spotX?: number;
  spotY?: number;
  mapSnapshotDataUrl?: string;
  badgesMasked?: string[];
  badgesHashed?: string[];
  leadBadge?: string;
  workOrder?: string;
  planningNote?: string;
  acks?: {
    rwp: boolean;
    briefed: boolean;
    dose: boolean;
    onlyAreasBriefed: boolean;
  };
  status: "entry_pending" | "ready" | "briefed" | "entered" | "denied";
  exportedAt?: string;
};

export const isCTMT = (area: Area): boolean => area.category === "CTMT";
export const isRHR = (area: Area): boolean => area.category === "RHR";
