import React, { createContext, useContext, useMemo, useState } from "react";

interface AckState {
  rwp: boolean;
  briefed: boolean;
  dose: boolean;
  onlyAreasBriefed: boolean;
}

interface DraftEntry {
  areaId?: string;
  areaName?: string;
  spotX?: number;
  spotY?: number;
  mapSnapshotDataUrl?: string;
}

interface OperatorContextValue {
  acks: AckState | null;
  setAcks: (acks: AckState) => void;
  clearAcks: () => void;
  draft: DraftEntry | null;
  updateDraft: (partial: DraftEntry | null) => void;
}

const OperatorContext = createContext<OperatorContextValue | undefined>(undefined);

export const OperatorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [acks, setAcksState] = useState<AckState | null>(null);
  const [draft, setDraft] = useState<DraftEntry | null>(null);

  const setAcks = (next: AckState) => {
    setAcksState(next);
  };

  const clearAcks = () => {
    setAcksState(null);
  };

  const updateDraft = (partial: DraftEntry | null) => {
    if (partial === null) {
      setDraft(null);
      return;
    }
    setDraft((current) => ({ ...(current ?? {}), ...partial }));
  };

  const value = useMemo(
    () => ({
      acks,
      setAcks,
      clearAcks,
      draft,
      updateDraft,
    }),
    [acks, draft]
  );

  return <OperatorContext.Provider value={value}>{children}</OperatorContext.Provider>;
};

export const useOperatorFlow = (): OperatorContextValue => {
  const context = useContext(OperatorContext);
  if (!context) {
    throw new Error("useOperatorFlow must be used within an OperatorProvider");
  }
  return context;
};
