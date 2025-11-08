import React, { createContext, useContext, useMemo, useState } from "react";

interface AckState {
  rwp: boolean;
  briefed: boolean;
  dose: boolean;
  onlyAreasBriefed: boolean;
  useMapsForTripTicket: boolean;
  contactRpForQuestions: boolean;
}

interface CrewDraft {
  workRequest: string;
  badges: string[];
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
  crew: CrewDraft | null;
  setCrew: (crew: CrewDraft) => void;
  clearCrew: () => void;
  draft: DraftEntry | null;
  updateDraft: (partial: DraftEntry | null) => void;
}

const OperatorContext = createContext<OperatorContextValue | undefined>(undefined);

export const OperatorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [acks, setAcksState] = useState<AckState | null>(null);
  const [crew, setCrewState] = useState<CrewDraft | null>(null);
  const [draft, setDraft] = useState<DraftEntry | null>(null);

  const setAcks = (next: AckState) => {
    setAcksState(next);
  };

  const clearAcks = () => {
    setAcksState(null);
  };

  const setCrew = (next: CrewDraft) => {
    const trimmedBadges = next.badges.map((badge) => badge.trim()).filter((badge) => badge.length > 0);
    setCrewState({
      workRequest: next.workRequest.trim(),
      badges: trimmedBadges,
    });
  };

  const clearCrew = () => {
    setCrewState(null);
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
      crew,
      setCrew,
      clearCrew,
      draft,
      updateDraft,
    }),
    [acks, crew, draft]
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
