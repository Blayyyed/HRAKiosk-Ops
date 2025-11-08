// src/pages/Finalize.tsx
import React, { useMemo, useState } from "react";
import { useLocation, useNavigate, useParams, Link } from "react-router-dom";
import { db } from "../db/dexie";
import { EntryRecord } from "../lib/entryTypes";

type NavState = {
  areaId?: string;
  areaName?: string;
  mapSnapshotDataUrl?: string;
  // from Map Select (optional; form still works if absent)
  mapPin?: { x: number; y: number } | null;
  overheadNeeded?: boolean;
  overheadHeight?: string | null;
};

const Finalize: React.FC = () => {
  const nav = useNavigate();
  const params = useParams();
  const { state } = useLocation();
  const s = (state || {}) as NavState;

  const areaId = s.areaId ?? params.areaId ?? "";
  const areaName = s.areaName ?? "Unknown area";

  // Work order + badges (multiple)
  const [workOrder, setWorkOrder] = useState("");
  const [badgeInput, setBadgeInput] = useState("");
  const [badges, setBadges] = useState<string[]>([]);

  // Bring in map/overhead from previous step if provided
  const mapPin = s.mapPin ?? null;
  const overheadNeeded = s.overheadNeeded ?? undefined;
  const overheadHeight = s.overheadHeight ?? undefined;
  const mapSnapshotDataUrl = s.mapSnapshotDataUrl ?? undefined;

  const okToSave = useMemo(() => {
    return areaId && badges.length > 0 && workOrder.trim() !== "";
  }, [areaId, badges, workOrder]);

  const addBadge = () => {
    const raw = badgeInput.trim();
    if (!raw) return;
    // allow comma-separated input or single
    const newOnes = raw
      .split(",")
      .map((b) => b.trim())
      .filter((b) => b.length > 0);
    const merged = Array.from(new Set([...badges, ...newOnes]));
    setBadges(merged);
    setBadgeInput("");
  };

  const removeBadge = (b: string) => {
    setBadges((prev) => prev.filter((x) => x !== b));
  };

  const save = async () => {
    if (!okToSave) return;
    const id = crypto.randomUUID();
    const rec: EntryRecord = {
      id,
      timestamp: new Date().toISOString(),
      areaId: String(areaId),
      areaName,
      spX: mapPin?.x ?? 0.5,
      spY: mapPin?.y ?? 0.5,
      mapSnapshotDataUrl,
      badges,
      workOrder: workOrder.trim(),
      overheadNeeded,
      overheadHeight: overheadNeeded ? (overheadHeight ?? undefined) : undefined,
      status: "entry_pending",
    };
    await db.entries.add(rec);
    nav("/thanks");
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">Finalize Entry</h1>
        <Link to="/" className="text-blue-600 text-sm">
          Back to Home
        </Link>
      </div>

      {/* Summary */}
      <div className="bg-white border rounded p-4 space-y-2">
        <div>
          <b>Area:</b> {areaName}
        </div>
        {overheadNeeded !== undefined && (
          <div className="text-sm">
            <b>Overhead:</b>{" "}
            {overheadNeeded ? `Yes (${overheadHeight ?? "unspecified"} ft)` : "No"}
          </div>
        )}
        {mapSnapshotDataUrl && (
          <img
            src={mapSnapshotDataUrl}
            alt="Map snapshot"
            className="mt-2 border rounded"
          />
        )}
      </div>

      {/* Work order */}
      <div className="bg-white border rounded p-4">
        <label className="block text-sm font-medium mb-1">Work Order #</label>
        <input
          value={workOrder}
          onChange={(e) => setWorkOrder(e.target.value)}
          className="border rounded w-full px-3 py-2"
          placeholder="Enter work order number"
        />
      </div>

      {/* Multi-badge input */}
      <div className="bg-white border rounded p-4 space-y-3">
        <label className="block text-sm font-medium">
          Worker Badges (multiple)
        </label>

        <div className="flex gap-2">
          <input
            value={badgeInput}
            onChange={(e) => setBadgeInput(e.target.value)}
            className="border rounded px-3 py-2 w-full"
            placeholder="Type a badge # and press + (or paste comma-separated)"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addBadge();
              }
            }}
          />
          <button
            type="button"
            onClick={addBadge}
            className="px-3 py-2 bg-blue-600 text-white rounded"
          >
            +
          </button>
        </div>

        {/* chips */}
        {badges.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {badges.map((b) => (
              <span
                key={b}
                className="inline-flex items-center gap-2 bg-slate-100 border rounded-full px-3 py-1 text-sm"
              >
                {b}
                <button
                  onClick={() => removeBadge(b)}
                  className="text-rose-600"
                  title="Remove"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* actions */}
      <div className="flex justify-end">
        <button
          disabled={!okToSave}
          onClick={save}
          className={`px-4 py-2 rounded text-white ${
            okToSave ? "bg-blue-600 hover:bg-blue-700" : "bg-slate-400"
          }`}
        >
          Submit
        </button>
      </div>
    </div>
  );
};

export default Finalize;
