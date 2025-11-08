import React, { useEffect, useMemo, useState } from "react";
import { db } from "../db/dexie";
import type { Area, EntryRecord } from "../lib/entryTypes";
import StatusChip from "../components/StatusChip";
import { downloadFile, toCSV } from "../lib/export";
import { useAuth } from "../auth/AuthContext";

const AdminPage: React.FC = () => {
  const { logout } = useAuth();
  const [areas, setAreas] = useState<Area[]>([]);
<<<<<<< HEAD
  const [ctmtId, setCtmtId] = useState<string>("");
=======
>>>>>>> origin/codex/implement-ctmt-and-rhr-maps-flow-x31wew

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
<<<<<<< HEAD
=======
  const [saving, setSaving] = useState(false);

  // creation forms
  const [ctmtName, setCtmtName] = useState<string>("");
  const [ctmtImage, setCtmtImage] = useState<string | null>(null);
  const [ctmtSaving, setCtmtSaving] = useState(false);

  const [rhrName, setRhrName] = useState<string>("");
  const [rhrImage, setRhrImage] = useState<string | null>(null);
  const [rhrSaving, setRhrSaving] = useState(false);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [adminError, setAdminError] = useState<string | null>(null);

  const fileToDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ""));
      reader.onerror = () => reject(reader.error ?? new Error("Unable to read file"));
      reader.readAsDataURL(file);
    });

  const resolveMapSrc = (path?: string | null) =>
    path && path.length > 0 ? path : "/maps/placeholder.svg";

  const handleCtmtFile = async (file: File | null) => {
    if (!file) {
      setCtmtImage(null);
      return;
    }
    try {
      const dataUrl = await fileToDataUrl(file);
      setCtmtImage(dataUrl);
    } catch (err) {
      console.error("Failed to read CTMT map file", err);
    }
  };

  const handleRhrFile = async (file: File | null) => {
    if (!file) {
      setRhrImage(null);
      return;
    }
    try {
      const dataUrl = await fileToDataUrl(file);
      setRhrImage(dataUrl);
    } catch (err) {
      console.error("Failed to read RHR map file", err);
    }
  };

  const addCtmtArea = async () => {
    const name = ctmtName.trim();
    if (!name) {
      return;
    }
    setAdminError(null);
    setCtmtSaving(true);
    try {
      await db.areas.add({
        id: `CT_${crypto.randomUUID()}`,
        name,
        mapPath: ctmtImage ?? "/maps/placeholder.svg",
        category: "CTMT",
      });
      setCtmtName("");
      setCtmtImage(null);
      await loadAreas();
    } finally {
      setCtmtSaving(false);
    }
  };

  const addRhrArea = async () => {
    const name = rhrName.trim();
    if (!name) {
      return;
    }
    setAdminError(null);
    setRhrSaving(true);
    try {
      await db.areas.add({
        id: `RHR_${crypto.randomUUID()}`,
        name,
        mapPath: rhrImage ?? "/maps/placeholder.svg",
        category: "RHR",
      });
      setRhrName("");
      setRhrImage(null);
      await loadAreas();
    } finally {
      setRhrSaving(false);
    }
  };

  const loadAreas = async () => {
    const all = await db.areas.toArray();
    all.forEach((area) => {
      if (!area.category) {
        area.category = "CTMT";
      }
    });
    all.sort((a, b) => a.name.localeCompare(b.name));
    setAreas(all);
  };
>>>>>>> origin/codex/implement-ctmt-and-rhr-maps-flow-x31wew

  const deleteArea = async (area: Area) => {
    const confirmed = window.confirm(
      `Delete “${area.name}”? This action cannot be undone.`
    );
    if (!confirmed) {
      return;
    }
    setAdminError(null);
    setDeletingId(area.id);
    try {
      await db.areas.delete(area.id);
      await loadAreas();
    } catch (err) {
      console.error("Failed to delete map", err);
      setAdminError("Unable to delete map. Please retry.");
    } finally {
      setDeletingId(null);
    }
  };

  const ctmtAreas = useMemo(
    () => areas.filter((a) => (a.category ?? "CTMT") === "CTMT"),
    [areas]
  );
  const rhrAreas = useMemo(
    () => areas.filter((a) => (a.category ?? "CTMT") === "RHR"),
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
    if (list.length > 0 && !ctmtId) {
      const ct = (list as Area[]).find((a) => (a.category || "CTMT") === "CTMT");
      if (ct) setCtmtId(ct.id);
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

<<<<<<< HEAD
  // ───── CTMT upload ─────
  const onCtmtFile = (file: File | null) => {
=======
  // ==== Update Maps modal helpers ====
  const openUpdateMaps = () => {
    setSelectedAreaId("");
    setPreviewUrl(undefined);
    setIncomingDataUrl(undefined);
    setShowUpdateMaps(true);
  };

  const closeUpdateMaps = () => {
    setShowUpdateMaps(false);
  };

  const onAreaChange = (val: string) => {
    setSelectedAreaId(val);
    const found = areas.find((a) => a.id === val);
    setPreviewUrl(resolveMapSrc(found?.mapPath));
    setIncomingDataUrl(undefined);
  };

  const onFile = (file: File | null) => {
>>>>>>> origin/codex/implement-ctmt-and-rhr-maps-flow-x31wew
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setRhrDataUrl(undefined); // safety
    reader.readAsDataURL(file);
  };

  const onCtmtFileAlt = (file: File | null, setter: (v: string | undefined) => void) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setter(String(reader.result));
    reader.readAsDataURL(file);
  };

  const onSaveCtmt = async (dataUrl?: string) => {
    if (!ctmtId) return;
    if (!dataUrl) return;

    await db.areas.update(ctmtId, { mapPath: dataUrl });
    await refreshAreas();
  };

  // ───── RHR create/update ─────
  const onRhrUpload = (file: File | null) => {
    if (!file) return;
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

  const exportEntries = async (format: "csv" | "json") => {
    if (filteredQueue.length === 0) return;
    const nowIso = new Date().toISOString();
    const selected = filteredQueue.map((item) => item.record);
    if (format === "csv") {
      const csv = toCSV(selected);
      downloadFile(`hra-entries-${nowIso}.csv`, csv, "text/csv");
    } else {
      const data = JSON.stringify(selected, null, 2);
      downloadFile(`hra-entries-${nowIso}.json`, data, "application/json");
    }
    await db.entries.bulkPut(
      selected.map((entry) => ({ ...entry, exportedAt: nowIso }))
    );
    await refreshEntries();
  };

  const purgeOlderThan = async () => {
    const days = Math.max(0, purgeDays);
    if (days <= 0) return;
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    const toDelete: string[] = [];
    entries.forEach((entry) => {
      const ts = Date.parse(entry.timestamp);
      if (Number.isFinite(ts) && ts < cutoff) {
        toDelete.push(entry.id);
      }
    });
    if (toDelete.length === 0) return;
    await db.entries.bulkDelete(toDelete);
    await refreshEntries();
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
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
        <button className="k-btn" onClick={async () => { await db.entries.clear(); await refreshEntries(); }}>
          Clear All Entries
        </button>
      </div>

<<<<<<< HEAD
      {/* CTMT Map Updates */}
      <div className="k-card space-y-4">
        <h2 className="font-semibold text-slate-800">CTMT Map Updates</h2>
=======
      {adminError && (
        <div className="bg-rose-100 border border-rose-200 text-rose-700 px-4 py-2 rounded">
          {adminError}
        </div>
      )}

      {/* CTMT creation */}
      <section className="bg-white border rounded-lg p-5 space-y-4">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-slate-800">CTMT Maps</h2>
          <p className="text-sm text-slate-600">
            Add CTMT maps and optional images for the operator rounds flow.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700">
                CTMT map name
              </label>
              <input
                value={ctmtName}
                onChange={(e) => setCtmtName(e.target.value)}
                className="border rounded px-3 py-2 w-full"
                placeholder="e.g. CTMT Elevation 120"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700">
                Optional map image upload
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => void handleCtmtFile(e.target.files?.[0] ?? null)}
              />
              <p className="text-xs text-slate-500">
                If no image is selected, the placeholder map will be used.
              </p>
            </div>

            <button
              onClick={addCtmtArea}
              disabled={ctmtSaving || ctmtName.trim() === ""}
              className={`px-4 py-2 rounded text-white font-medium ${
                ctmtSaving || ctmtName.trim() === ""
                  ? "bg-slate-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {ctmtSaving ? "Saving…" : "Add CTMT Map"}
            </button>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-700">Preview</p>
            <div className="border rounded bg-slate-100 p-3 flex justify-center">
              <img
                src={resolveMapSrc(ctmtImage)}
                alt="CTMT preview"
                className="max-h-64 rounded"
              />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-slate-800">Existing CTMT maps</h3>
          {ctmtAreas.length === 0 ? (
            <p className="text-sm text-slate-600 mt-2">
              No CTMT maps stored yet. Add one using the form above.
            </p>
          ) : (
            <div className="mt-3 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {ctmtAreas.map((area) => (
                <div key={area.id} className="border rounded-lg overflow-hidden flex flex-col">
                  <div className="bg-slate-50 border-b px-3 py-2 flex items-center justify-between gap-3 text-sm font-semibold text-slate-800">
                    <span className="truncate" title={area.name}>
                      {area.name}
                    </span>
                    <button
                      onClick={() => void deleteArea(area)}
                      disabled={deletingId === area.id}
                      className={`text-xs px-2 py-1 rounded border ${
                        deletingId === area.id
                          ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                          : "bg-white text-rose-600 hover:bg-rose-50"
                      }`}
                    >
                      {deletingId === area.id ? "Deleting…" : "Delete"}
                    </button>
                  </div>
                  {record.planningNote && <div>Note: {record.planningNote}</div>}
                </div>
                {record.mapSnapshotDataUrl && (
                  <img
                    src={record.mapSnapshotDataUrl}
                    alt="Snapshot"
                    className="rounded border max-h-48 object-contain"
                  />
                )}
                <div className="flex flex-wrap gap-2">
                  <button className="k-btn" onClick={() => markStatus(record.id, "ready")}>
                    Mark Ready
                  </button>
                  <button className="k-btn" onClick={() => markStatus(record.id, "briefed")}>
                    Mark Briefed
                  </button>
                  <button className="k-btn" onClick={() => markStatus(record.id, "entered")}>
                    Mark Entered
                  </button>
                  <button className="k-btn" onClick={() => markStatus(record.id, "denied")}>
                    Deny
                  </button>
                </div>
                {area && (
                  <div className="text-xs text-slate-500">Source map: {area.name}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* RHR creation */}
      <section className="bg-white border rounded-lg p-5 space-y-4">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-slate-800">RHR / RCIC Maps</h2>
          <p className="text-sm text-slate-600">
            Maintain the RHR and RCIC map gallery used when operators request additional access.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700">
                RHR map name
              </label>
              <input
                value={rhrName}
                onChange={(e) => setRhrName(e.target.value)}
                className="border rounded px-3 py-2 w-full"
                placeholder="e.g. RHR Pump A"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700">
                Optional map image upload
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => void handleRhrFile(e.target.files?.[0] ?? null)}
              />
              <p className="text-xs text-slate-500">
                If no image is selected, the placeholder map will be used.
              </p>
            </div>

            <button
              onClick={addRhrArea}
              disabled={rhrSaving || rhrName.trim() === ""}
              className={`px-4 py-2 rounded text-white font-medium ${
                rhrSaving || rhrName.trim() === ""
                  ? "bg-slate-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              Add CTMT Map
            </button>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-700">Preview</p>
            <div className="border rounded bg-slate-100 p-3 flex justify-center">
              <img
                src={resolveMapSrc(rhrImage)}
                alt="RHR preview"
                className="max-h-64 rounded"
              />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-slate-800">Existing RHR maps</h3>
          {rhrAreas.length === 0 ? (
            <p className="text-sm text-slate-600 mt-2">
              No RHR maps stored yet. Add one using the form above.
            </p>
          ) : (
            <div className="mt-3 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {rhrAreas.map((area) => (
                <div key={area.id} className="border rounded-lg overflow-hidden flex flex-col">
                  <div className="bg-slate-50 border-b px-3 py-2 flex items-center justify-between gap-3 text-sm font-semibold text-slate-800">
                    <span className="truncate" title={area.name}>
                      {area.name}
                    </span>
                    <button
                      onClick={() => void deleteArea(area)}
                      disabled={deletingId === area.id}
                      className={`text-xs px-2 py-1 rounded border ${
                        deletingId === area.id
                          ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                          : "bg-white text-rose-600 hover:bg-rose-50"
                      }`}
                    >
                      {deletingId === area.id ? "Deleting…" : "Delete"}
                    </button>
                  </div>
                  <img
                    src={resolveMapSrc(area.mapPath)}
                    alt={area.name}
                    className="w-full object-contain max-h-56"
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* list */}
      <h2 className="text-xl font-semibold">Entry Pending</h2>
      <div className="grid md:grid-cols-2 gap-5">
        {pending.map((p) => (
          <div key={p.id} className="bg-white border rounded p-3">
            <div className="flex justify-between text-sm">
              <div>
                <div className="font-semibold">{p.areaName}</div>
                <div className="text-xs text-slate-600">
                  {new Date(p.timestamp).toLocaleString()}
                </div>
              </div>
              <div className="text-xs text-right">
                {/* Badges: comma-separated */}
                {p.badges?.length ? (
                  <div>
                    Badges: <b>{p.badges.join(", ")}</b>
                  </div>
                ) : (
                  <div>
                    Badges: <b>—</b>
                  </div>
                )}
                <div>
                  WO: <b>{p.workOrder}</b>
                </div>
                {p.overheadNeeded !== undefined && (
                  <div>
                    Overhead:{" "}
                    <b>
                      {p.overheadNeeded
                        ? `Yes${p.overheadHeight ? ` (${p.overheadHeight} ft)` : ""}`
                        : "No"}
                    </b>
                  </div>
                )}
              </div>
            </div>
>>>>>>> origin/codex/implement-ctmt-and-rhr-maps-flow-x31wew

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
          <p className="text-sm text-slate-600">Upload a new map image for the selected CTMT elevation.</p>
          <input type="file" accept="image/*" onChange={(e) => onCtmtFileAlt(e.target.files?.[0] || null, (v) => v && onSaveCtmt(v))} />
          <div className="mt-2">
            <p className="text-sm text-slate-500">Preview of current map</p>
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

      {/* Pending entries */}
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
                  Badges: <b>{p.badges?.length ? p.badges.join(", ") : "—"}</b><br />
                  WO: <b>{p.workOrder || "—"}</b>
                </div>
              </div>
              {p.mapSnapshotDataUrl && <img src={p.mapSnapshotDataUrl} className="mt-2 rounded border" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
