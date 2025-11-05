// src/pages/Admin.tsx
import React, { useEffect, useMemo, useState } from "react";
import { db } from "../db/dexie";
import { EntryRecord, Area } from "../lib/entryTypes";
import { useAuth } from "../auth/AuthContext";

const AdminPage: React.FC = () => {
  const { logout } = useAuth();

  // entries and areas
  const [pending, setPending] = useState<EntryRecord[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);

  // update maps modal state
  const [showUpdateMaps, setShowUpdateMaps] = useState(false);
  const [selectedAreaId, setSelectedAreaId] = useState<string>("");
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(undefined);
  const [incomingDataUrl, setIncomingDataUrl] = useState<string | undefined>(
    undefined
  );
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

  useEffect(() => {
    refreshEntries();
    loadAreas();
  }, []);

  const clearAll = async () => {
    await db.entries.clear();
    await refreshEntries();
  };

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
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || "");
      setIncomingDataUrl(dataUrl);
      setPreviewUrl(dataUrl); // show new preview immediately
    };
    reader.readAsDataURL(file);
  };

  const saveMap = async () => {
    if (!selectedAreaId || !incomingDataUrl) return;
    setSaving(true);
    try {
      await db.areas.update(selectedAreaId, { mapPath: incomingDataUrl });
      await loadAreas();
      setShowUpdateMaps(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <button
          onClick={logout}
          className="text-sm bg-red-500 text-white px-3 py-1 rounded"
        >
          Logout
        </button>
      </div>

      {/* controls */}
      <div className="flex gap-3">
        <button
          onClick={openUpdateMaps}
          className="px-3 py-2 rounded border bg-white hover:bg-slate-50"
        >
          Update Maps
        </button>
        <button
          onClick={refreshEntries}
          className="px-3 py-2 rounded border bg-white hover:bg-slate-50"
        >
          Refresh Queue
        </button>
        <button
          onClick={clearAll}
          className="px-3 py-2 rounded border text-red-600 bg-white hover:bg-slate-50"
        >
          Clear All Entries
        </button>
      </div>

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
                  <img
                    src={resolveMapSrc(area.mapPath)}
                    alt={area.name}
                    className="w-full object-contain max-h-56"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
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
              {rhrSaving ? "Saving…" : "Add RHR Map"}
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
          )}
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

            {p.mapSnapshotDataUrl && (
              <img
                src={p.mapSnapshotDataUrl}
                className="mt-2 rounded border"
                alt="Map snapshot"
              />
            )}
          </div>
        ))}
      </div>

      {/* ---- Update Maps modal ---- */}
      {showUpdateMaps && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[1000]">
          <div className="bg-white rounded-lg shadow-xl w-[680px] max-w-[90vw]">
            <div className="px-5 py-3 border-b flex justify-between items-center">
              <h3 className="font-semibold">Update Map Image</h3>
              <button
                className="text-sm text-slate-600 hover:text-black"
                onClick={closeUpdateMaps}
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Area selector */}
              <div className="space-y-1">
                <label className="block text-sm font-medium">
                  Choose an area
                </label>
                <select
                  value={selectedAreaId}
                  onChange={(e) => onAreaChange(e.target.value)}
                  className="border rounded px-3 py-2 w-full"
                >
                  <option value="">— Select an area —</option>
                  {areas.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Current / new preview */}
              <div className="space-y-1">
                <label className="block text-sm font-medium">Preview</label>
                <div className="border rounded bg-slate-100 p-2">
                  {previewUrl ? (
                    <img src={previewUrl} className="max-h-[320px] mx-auto" />
                  ) : (
                    <div className="text-sm text-slate-500 p-8 text-center">
                      Select an area to preview its current map.
                    </div>
                  )}
                </div>
              </div>

              {/* File input */}
              <div className="space-y-1">
                <label className="block text-sm font-medium">
                  Upload new map image (PNG/JPG)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => onFile(e.target.files?.[0] ?? null)}
                />
                <p className="text-xs text-slate-500">
                  The image will be stored in the browser’s database and used
                  for this area going forward.
                </p>
              </div>
            </div>

            <div className="px-5 py-3 border-t flex justify-end gap-2">
              <button
                className="px-3 py-2 rounded border bg-white hover:bg-slate-50"
                onClick={closeUpdateMaps}
              >
                Cancel
              </button>
              <button
                disabled={!selectedAreaId || !incomingDataUrl || saving}
                onClick={saveMap}
                className={`px-3 py-2 rounded text-white ${
                  !selectedAreaId || !incomingDataUrl || saving
                    ? "bg-slate-400"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
