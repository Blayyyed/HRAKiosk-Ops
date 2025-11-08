export type Area = {
  id: string;
  name: string;
  elevation?: string;
  mapPath: string;
  doseRate_mrem_hr: number;
  contamination_cpm?: number;
  hfc?: string;
  notes?: string;
};

export type RWP = {
  id: string;
  workRequest: string;
  task: string;
  areaId: string;
  entryReqs: {
    hra: boolean;
    fr: boolean;
    dosimeter: string;
    respirator?: string;
    other?: string[];
  };
  validFrom: string;
  validTo?: string;
};

export type Acknowledgment = {
  id: string;
  timestamp: string;
  workerId: string;
  workerName?: string;
  areaId: string;
  rwpId: string;
  checks: {
    readMap: boolean;
    readEntryReqs: boolean;
    understandHRA: boolean;
    friskerAvail: boolean;
  };
  signatureDataUrl: string;
  deviceInfo?: string;
  appVersion: string;
};