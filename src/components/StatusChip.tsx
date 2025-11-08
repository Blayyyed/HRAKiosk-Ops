import React from "react";
import type { EntryRecord } from "../lib/entryTypes";

type Status = EntryRecord["status"];

type StatusConfig = {
  label: string;
  bg: string;
  text: string;
};

const STATUS_STYLES: Record<Status, StatusConfig> = {
  entry_pending: {
    label: "Pending",
    bg: "bg-slate-100",
    text: "text-blue-700",
  },
  ready: {
    label: "Ready",
    bg: "bg-amber-100",
    text: "text-amber-800",
  },
  briefed: {
    label: "Briefed",
    bg: "bg-green-100",
    text: "text-green-800",
  },
  entered: {
    label: "Entered",
    bg: "bg-emerald-100",
    text: "text-emerald-800",
  },
  denied: {
    label: "Denied",
    bg: "bg-rose-100",
    text: "text-rose-800",
  },
};

interface StatusChipProps {
  status: Status;
}

const StatusChip: React.FC<StatusChipProps> = ({ status }) => {
  const { label, bg, text } = STATUS_STYLES[status];
  return (
    <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${bg} ${text}`}>
      {label}
    </span>
  );
};

export default StatusChip;
