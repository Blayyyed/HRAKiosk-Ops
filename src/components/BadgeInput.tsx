import React, { useState } from "react";

interface BadgeInputProps {
  badges: string[];
  onChange: (next: string[]) => void;
}

const normalizeBadges = (values: string[]): string[] =>
  values
    .map((badge) => badge.trim())
    .filter((badge) => badge.length > 0);

const BadgeInput: React.FC<BadgeInputProps> = ({ badges, onChange }) => {
  const [input, setInput] = useState("");

  const addBadge = () => {
    const normalized = normalizeBadges(input.split(","));
    if (normalized.length === 0) {
      return;
    }
    const existing = new Set(badges);
    const merged: string[] = [...badges];
    normalized.forEach((value) => {
      if (!existing.has(value)) {
        merged.push(value);
      }
    });
    onChange(merged);
    setInput("");
  };

  const removeBadge = (value: string) => {
    const filtered = badges.filter((badge) => badge !== value);
    onChange(filtered);
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
              key={badge}
              className="flex items-center gap-2 bg-slate-100 border rounded-full px-3 py-1 text-sm"
            >
              <span>{badge}</span>
              <button
                type="button"
                onClick={() => removeBadge(badge)}
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
