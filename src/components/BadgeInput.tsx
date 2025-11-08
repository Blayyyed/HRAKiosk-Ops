import React, { useState } from "react";
import { maskBadge } from "../lib/crypto";

export type BadgeValue = {
  value: string;
  isLead: boolean;
};

interface BadgeInputProps {
  badges: BadgeValue[];
  onChange: (next: BadgeValue[]) => void;
}

const normalizeBadges = (values: string[]): string[] => {
  return values
    .map((badge) => badge.trim())
    .filter((badge) => badge.length > 0);
};

const BadgeInput: React.FC<BadgeInputProps> = ({ badges, onChange }) => {
  const [input, setInput] = useState("");

  const addBadge = () => {
    const normalized = normalizeBadges(input.split(","));
    if (normalized.length === 0) {
      return;
    }
    const existing = new Set(badges.map((b) => b.value));
    const merged: BadgeValue[] = [...badges];
    normalized.forEach((value) => {
      if (!existing.has(value)) {
        merged.push({ value, isLead: merged.length === 0 });
      }
    });
    onChange(merged);
    setInput("");
  };

  const removeBadge = (value: string) => {
    const filtered = badges.filter((badge) => badge.value !== value);
    if (filtered.length === 0) {
      onChange([]);
      return;
    }
    if (filtered.some((badge) => badge.isLead)) {
      onChange(filtered);
      return;
    }
    filtered[0] = { ...filtered[0], isLead: true };
    onChange(filtered);
  };

  const setLead = (value: string) => {
    onChange(badges.map((badge) => ({ ...badge, isLead: badge.value === value })));
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          className="border rounded px-3 py-2 w-full"
          placeholder="Enter badge # (comma-separated for multiple)"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addBadge();
            }
          }}
        />
        <button type="button" className="k-btn" onClick={addBadge}>
          Add
        </button>
      </div>

      {badges.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {badges.map((badge) => (
            <div
              key={badge.value}
              className="flex items-center gap-2 bg-slate-100 border rounded-full px-3 py-1 text-sm"
            >
              <span>{maskBadge(badge.value)}</span>
              <button
                type="button"
                onClick={() => setLead(badge.value)}
                className={`text-xs px-2 py-1 rounded ${
                  badge.isLead ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-700"
                }`}
              >
                {badge.isLead ? "Lead" : "Make Lead"}
              </button>
              <button
                type="button"
                onClick={() => removeBadge(badge.value)}
                className="text-rose-600"
                title="Remove badge"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BadgeInput;
