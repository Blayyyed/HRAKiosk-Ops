// src/lib/entryTypes.ts

export type AreaCategory = "CTMT" | "RHR";

export type Area = {
  id: string;
  name: string;
  mapPath: string;
  category?: AreaCategory;
  elevation?: string;
  doseRate_mrem_hr?: number;
  contamination_cpm?: number;
  hfc?: string;
  notes?: string;
};

export type EntryStatus =
  | "entry_pending"
  | "ready"
  | "briefed"
  | "entered"
  | "denied";

export type EntryAcknowledgment = {
  rwp: boolean;
  briefed: boolean;
  dose: boolean;
  onlyAreasBriefed: boolean;
  useMapsForTripTicket: boolean;
  contactRpForQuestions: boolean;
};

export type EntryRecord = {
  id: string;
  timestamp: string;
  areaId: string;
  areaName: string;
  spotX?: number;
  spotY?: number;
  mapSnapshotDataUrl?: string;
  badges: string[];
  badgesMasked?: string[];
  badgesHashed?: string[];
  workRequest?: string;
  planningNote?: string;
  overheadNeeded?: boolean;
  overheadHeight?: number;
  acks?: EntryAcknowledgment;
  status: EntryStatus;
  exportedAt?: string;
};
