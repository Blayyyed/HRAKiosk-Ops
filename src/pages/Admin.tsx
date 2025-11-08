// src/pages/Admin.tsx
import React, { useEffect, useMemo, useState } from "react";
import { db } from "../db/dexie";
import type { Area, EntryRecord } from "../lib/entryTypes";
import { seedMock } from "../db/seed";
import { useAuth } from "../auth/AuthContext";

const AdminPage: React.FC = () => {
  const { logout } = useAuth();

  // queue
  const [pending, setPending] = useState<EntryRecord[]>([]);
  // areas
  const [areas, setAreas] = useState<Area[]>([]);
  const [ctmtId, setCtmtId] = useState<string>("");

  // RHR create form
  const [rhrName, setRhrName] = useState("");
  const [rhrDataUrl, setRhrDataUrl] = useState<string | undefined>(undefined);

  const ctmtAreas = useMemo(
    () => areas.filter((a) => (a.category || "CTMT") === "CTMT"),
    [areas]
  );
  const rhrAreas = useMemo(
    () => areas.filter((a) => a.category === "RHR"),
    [areas]
  );

  const refreshEntries = async () => {
    const rows = await db.entries
      .where("status")
      .equals("entry_pending")
      .reverse()
      .sortBy("timestamp");
    setPending(rows);
  };

  const refreshAreas = async () => {
    const list = await db.areas.toArray();
    setAreas(list as Area[]);
    if (!ctmtId) {
      const first = (list as Area[]).find((a) => (a.category || "CTMT") === "CTMT");
      if (first) setCtmtId(first.id);
    }
  };

  useEffect(() => {
    refreshEntries();
    refreshAreas();
  }, []);

  const onSeed = async () => {
    await seedMock();
    await refreshAreas();
  };

  // ───── CTMT upload ─────
  const onCtmtUpload = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || "");
      if (!ctmtId) return;
      db.areas.update(ctmtId, { mapPath: dataUrl }).then(refreshAreas);
    };
    reader.readAsDataURL(file);
  };

  // ───── RHR create/update ─────
  const onRhrUpload = (file: File | null) => {
    if (!file) {
      setRhrDataUrl(undefined);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setRhrDataUrl(String(reader.result));
    reader.readAsDataURL(file);
  };

  const onCreateRhr = async () => {
    const name = rhrName.trim();
    if (!name) return;

    const newArea: Area = {
      id: `RHR_${crypto.randomUUID()}`,
      name,
      mapPath: rhrDataUrl || "/maps/placeholder.svg",
      category: "RHR",
    };
    await db.areas.add(newArea);
    setRhrName("");
    setRhrDataUrl(undefined);
    await refreshAreas();
  };

  const markStatus = async (id: string, next: EntryRecord["status"]) => {
    await db.entries.update(id, { status: next });
    await refreshEntries();
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Admin</h1>
        <div className="flex gap-3">
          <button onClick={logout} className="k-btn px-4 py-2">Logout</button>
        </div>
      </div>

      {/* Controls */}
      <div className="k-card space-x-3">
        <button className="k-btn" onClick={onSeed}>Seed CTMT (defaults)</button>
        <button className="k-btn" onClick={refreshAreas}>Reload Areas</button>
        <button className="k-btn" onClick={refreshEntries}>Refresh Queue</button>
        <button
          className="k-btn"
          onClick={async () => { await db.entries.clear(); await refreshEntries(); }}
        >
          Clear All Entries
        </button>
      </div>

      {/* CTMT Map Updates */}
      <div className="k-card space-y-4">
        <h2 className="font-semibold text-slate-800">CTMT Map Updates</h2>

        <div className="flex gap-3 items-center">
          <label className="text-sm">Choose elevation:</label>
          <select
            value={ctmtId}
            onChange={(e) => setCtmtId(e.target.value)}
            className="border rounded px-2 py-1"
          >
            {ctmtAreas.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-slate-600">
            Upload a new map image for the selected CTMT elevation.
          </p>
          <input type="file" accept="image/*" onChange={(e) => onCtmtUpload(e.target.files?.[0] || null)} />
          <div className="mt-2">
            <p className="text-sm text-slate-500">Current map</p>
            {ctmtId && (
              <img
                src={ctmtAreas.find((x) => x.id === ctmtId)?.mapPath || "/maps/placeholder.svg"}
                className="max-h-[260px] rounded border"
              />
            )}
          </div>
        </div>
      </div>

      {/* RHR / RCIC Maps */}
      <div className="k-card space-y-4">
        <h2 className="font-semibold text-slate-800">RHR / RCIC Maps</h2>

        <div className="space-y-2">
          <label className="block text-sm">New map name</label>
          <input
            value={rhrName}
            onChange={(e) => setRhrName(e.target.value)}
            placeholder="e.g., RHR Pump Room East"
            className="border rounded px-2 py-1 w-full"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm">Map image (optional — placeholder used if empty)</label>
          <input type="file" accept="image/*" onChange={(e) => onRhrUpload(e.target.files?.[0] || null)} />
          {rhrDataUrl && (
            <img src={rhrDataUrl} className="max-h-[260px] rounded border" />
          )}
        </div>

        <button className="k-btn" onClick={onCreateRhr}>Create RHR Map</button>

        <div className="mt-4">
          <p className="text-sm text-slate-600 mb-2">Existing RHR/RCIC maps</p>
          <div className="grid md:grid-cols-2 gap-3">
            {rhrAreas.map((a) => (
              <div key={a.id} className="k-card">
                <div className="font-semibold">{a.name}</div>
                <div className="text-xs text-slate-500 mb-2">{a.id}</div>
                <img src={a.mapPath || "/maps/placeholder.svg"} className="max-h-[180px] rounded border mb-2" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Entry Pending */}
      <div>
        <h2 className="font-semibold text-slate-800 mb-2">Entry Pending</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {pending.map((p) => (
            <div key={p.id} className="k-card">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">{p.areaName}</div>
                  <div className="text-xs text-slate-600">{new Date(p.timestamp).toLocaleString()}</div>
                </div>
                <div className="text-xs text-right">
                  WO: <b>{p.workOrder || "—"}</b>
                </div>
              </div>

              {p.mapSnapshotDataUrl && (
                <img src={p.mapSnapshotDataUrl} className="mt-2 rounded border" />
              )}

              <div className="flex gap-2 mt-3">
                <button className="k-btn" onClick={() => markStatus(p.id, "ready")}>Mark Ready</button>
                <button className="k-btn" onClick={() => markStatus(p.id, "briefed")}>Mark Briefed</button>
                <button className="k-btn" onClick={() => markStatus(p.id, "entered")}>Mark Entered</button>
                <button className="k-btn" onClick={() => markStatus(p.id, "denied")}>Deny</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
