import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../db/dexie";
import type { EntryRecord } from "../lib/entryTypes";
import { useOperatorFlow } from "../contexts/OperatorContext";
import BadgeInput, { BadgeValue } from "../components/BadgeInput";
import { hashBadge, maskBadge } from "../lib/crypto";

const Finalize: React.FC = () => {
  const navigate = useNavigate();
  const { acks, draft, updateDraft, clearAcks } = useOperatorFlow();

  const [badges, setBadges] = useState<BadgeValue[]>([]);
  const [workRequest, setWorkRequest] = useState("");
  const [planningNote, setPlanningNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!acks) {
      navigate("/ack", { replace: true });
    }
  }, [acks, navigate]);

  const areaName = draft?.areaName ?? "Pending area";
  const readyToSave = useMemo(() => {
    return badges.length > 0 && workRequest.trim().length > 0;
  }, [badges.length, workRequest]);

  const onSubmit = async () => {
    if (!readyToSave) return;
    if (!draft?.areaId || !draft?.areaName) {
      setError("Area details are missing. Please return to the map or CTMT flow.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const masked = badges.map((badge) => maskBadge(badge.value)).filter((value) => value);
      const hashed = await Promise.all(badges.map((badge) => hashBadge(badge.value)));
      const lead = badges.find((badge) => badge.isLead);

      const record: EntryRecord = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        areaId: draft.areaId,
        areaName: draft.areaName,
        spotX: draft.spotX,
        spotY: draft.spotY,
        mapSnapshotDataUrl: draft.mapSnapshotDataUrl,
        badgesMasked: masked,
        badgesHashed: hashed,
        leadBadge: lead ? maskBadge(lead.value) : undefined,
        workRequest: workRequest.trim(),
        planningNote: planningNote.trim() || undefined,
        acks: acks ?? undefined,
        status: "entry_pending",
      };

      await db.entries.add(record);
      updateDraft(null);
      clearAcks();
      navigate("/thanks");
    } catch (err) {
      console.error("Failed to save entry", err);
      setError("Unable to save entry. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">Finalize Entry</h1>
        <button className="k-btn px-4 py-2" onClick={() => navigate("/home")}>Back to Home</button>
      </div>

      <div className="k-card space-y-2">
        <div className="font-semibold text-slate-700">Area</div>
        <div>{areaName}</div>
        {draft?.mapSnapshotDataUrl && (
          <img
            src={draft.mapSnapshotDataUrl}
            alt="Map snapshot"
            className="mt-2 rounded border max-h-64 object-contain"
          />
        )}
      </div>

      <div className="k-card space-y-3">
        <label className="block text-sm font-medium text-slate-700" htmlFor="workRequest">
          Work Request #
        </label>
        <p className="text-xs text-slate-500">
          Required before entry. Provide the work request identifier for this crew.
        </p>
        <input
          id="workRequest"
          className="border rounded px-3 py-2"
          value={workRequest}
          onChange={(event) => setWorkRequest(event.target.value)}
          placeholder="Required"
        />
      </div>

      <div className="k-card space-y-3">
        <div className="space-y-1">
          <label className="block text-sm font-medium text-slate-700">Crew badges</label>
          <p className="text-xs text-slate-500">
            Enter each badge number and press Add. Mark one badge as the crew lead.
          </p>
        </div>
        <BadgeInput badges={badges} onChange={setBadges} />
      </div>

      <div className="k-card space-y-3">
        <label className="block text-sm font-medium text-slate-700" htmlFor="planningNote">
          Planning note (optional)
        </label>
        <textarea
          id="planningNote"
          className="border rounded px-3 py-2"
          rows={3}
          value={planningNote}
          onChange={(event) => setPlanningNote(event.target.value)}
          placeholder="Add additional context for RP if needed"
        />
      </div>

      {error && <div className="k-card border-rose-300 bg-rose-50 text-rose-700">{error}</div>}

      <div className="flex justify-end">
        <button
          className={`k-btn ${!readyToSave || saving ? "opacity-60 cursor-not-allowed" : ""}`}
          disabled={!readyToSave || saving}
          onClick={onSubmit}
        >
          {saving ? "Saving…" : "Submit"}
        </button>
      </div>
    </div>
  );
};

export default Finalize;
