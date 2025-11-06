// src/pages/Admin.tsx
import React, { useEffect, useMemo, useState } from "react";
import { db } from "../db/dexie";
import { Area, EntryRecord } from "../lib/entryTypes";
import { seedMock } from "../db/seed";
import { useAuth } from "../auth/AuthContext";

const PLACEHOLDER_SRC = "/maps/placeholder.svg";

const fileToDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () =>
      reject(readr.error ?? new Error("Unable to read the selected file."));
    reader.readAsDataURL(file);
  });

const resolveMapSrc = (path?: string | null) =>
  path && path.length > 0 ? path : PLACEHOLDER_SRC;

const AdminPage: React.FC = () => {
  const { logout } = useAuth();

  const [pending, setPending] = useState<EntryRecord[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [ctmtId, setCtmtId] = useState<string>("");

  const [ctmtName, setCtmtName] = useState("");
  const [ctmtImage, setCtmtImage] = useState<string | null>(null);
  const [ctmtSaving, setCtmtSaving] = useState(false);

  const [ctmtUpdateDataUrl, setCtmtUpdateDataUrl] = useState<string | null>(
    null
  );
  const [ctmtUpdateSaving, setCtmtUpdateSaving] = useState(false);

  const [rhrName, setRhrName] = useState("");
  const [rhrImage, setRhrImage] = useState<string | null>(null);
  const [rhrSaving, setRhrSaving] = useState(false);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [adminError, setAdminError] = useState<string | null>(null);

  const ctmtAreas = useMemo(
    () => areas.filter((area) => (area.category ?? "CTMT") === "CTMT"),
    [areas]
  );
  const rhrAreas = useMemo(
    () => areas.filter((area) => area.category === "RHR"),
    [areas]
  );

  const refreshEntries = async () => {
    try {
      const rows = await db.entries
        .where("status")
        .equals("entry_pending")
        .reverse()
        .sortBy("timestamp");
      setPending(rows);
    } catch (error) {
      console.error("Failed to load pending entries", error);
      setAdminError("Unable to load entry queue. Please retry.");
    }
  };

  const loadAreas = async () => {
    try {
      const list = await db.areas.toArray();
      const normalized = list
        .map((area) => ({
          ...area,
          category: area.category ?? "CTMT",
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
      setAreas(normalized as Area[]);
      if (!ctmtId) {
        const firstCt = normalized.find(
          (area) => (area.category ?? "CTMT") === "CTMT"
        );
        if (firstCt) {
          setCtmtId(firstCt.id);
        }
      }
    } catch (error) {
      console.error("Failed to load areas", error);
      setAdminError("Unable to load maps. Please retry.");
    }
  };

  useEffect(() => {
    void refreshEntries();
    void loadAreas();
  }, []);

  const handleCtmtFile = async (file: File | null) => {
    if (!file) {
      setCtmtImage(null);
      return;
    }

    try {
      const dataUrl = await fileToDataUrl(file);
      setCtmtImage(dataUrl);
    } catch (error) {
      console.error("Failed to read CTMT map file", error);
      setAdminError("Unable to read CTMT map file. Please choose another.");
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
    } catch (error) {
      console.error("Failed to read RHR map file", error);
      setAdminError("Unable to read RHR map file. Please choose another.");
    }
  };

  const handleCtmtUpdateFile = async (file: File | null) => {
    if (!file) {
      setCtmtUpdateDataUrl(null);
      return;
    }

    try {
      const dataUrl = await fileToDataUrl(file);
      setCtmtUpdateDataUrl(dataUrl);
    } catch (error) {
      console.error("Failed to read CTMT update file", error);
      setAdminError("Unable to read the update image. Please choose another.");
    }
  };

  const addCtmtArea = async () => {
    const trimmedName = ctmtName.trim();
    if (!trimmedName) {
      setAdminError("Provide a CTMT map name before saving.");
      return;
    }

    setAdminError(null);
    setCtmtSaving(true);
    try {
      await db.areas.add({
        id: `CT_${crypto.randomUUID()}`,
        name: trimmedName,
        mapPath: ctmtImage ?? PLACEHOLDER_SRC,
        category: "CTMT",
      });
      setCtmtName("");
      setCtmtImage(null);
      await loadAreas();
    } catch (error) {
      console.error("Failed to add CTMT area", error);
      setAdminError("Unable to add CTMT map. Please retry.");
    } finally {
      setCtmtSaving(false);
    }
  };

  const updateSelectedCtmtMap = async () => {
    if (!ctmtId) {
      setAdminError("Choose a CTMT map before uploading a replacement image.");
      return;
    }
    if (!ctmtUpdateDataUrl) {
      setAdminError("Upload a new image before saving the CTMT map.");
      return;
    }

    setAdminError(null);
    setCtmtUpdateSaving(true);
    try {
      await db.areas.update(ctmtId, { mapPath: ctmtUpdateDataUrl });
      setCtmtUpdateDataUrl(null);
      await loadAreas();
    } catch (error) {
      console.error("Failed to update CTMT map", error);
      setAdminError("Unable to update CTMT map. Please retry.");
    } finally {
      setCtmtUpdateSaving(false);
    }
  };

  const addRhrArea = async () => {
    const trimmedName = rhrName.trim();
    if (!trimmedName) {
      setAdminError("Provide an RHR map name before saving.");
      return;
    }

    setAdminError(null);
    setRhrSaving(true);
    try {
      await db.areas.add({
        id: `RHR_${crypto.randomUUID()}`,
        name: trimmedName,
        mapPath: rhrImage ?? PLACEHOLDER_SRC,
        category: "RHR",
      });
      setRhrName("");
      setRhrImage(null);
      await loadAreas();
    } catch (error) {
      console.error("Failed to add RHR area", error);
      setAdminError("Unable to add RHR map. Please retry.");
    } finally {
      setRhrSaving(false);
    }
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
await db.areas.where('id').equals(area.id).delete();
      await loadAreas();
    } catch (error) {
      console.error("Failed to delete map", error);
      setAdminError("Unable to delete map. Please retry.");
    } finally {
      setDeletingId(null);
    }
  };

  const onSeed = async () => {
    setAdminError(null);
    try {
      await seedMock();
      await loadAreas();
    } catch (error) {
      console.error("Failed to seed maps", error);
      setAdminError("Unable to seed maps. Please retry.");
    }
  };

  const clearEntries = async () => {
    const confirmed = window.confirm(
      "Clear all pending entry records? This cannot be undone."
    );
    if (!confirmed) {
      return;
    }

    try {
      await db.entries.clear();
      await refreshEntries();
    } catch (error) {
      console.error("Failed to clear entries", error);
      setAdminError("Unable to clear entries. Please retry.");
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Admin</h1>
        <button onClick={logout} className="k-btn px-4 py-2">
          Logout
        </button>
      </div>

      <div className="k-card flex flex-wrap gap-3">
        <button className="k-btn" onClick={onSeed}>
          Seed CTMT (defaults)
        </button>
        <button className="k-btn" onClick={() => void loadAreas()}>
          Reload Areas
        </button>
        <button className="k-btn" onClick={() => void refreshEntries()}>
          Refresh Queue
        </button>
        <button className="k-btn" onClick={() => void clearEntries()}>
          Clear All Entries
        </button>
      </div>

      {adminError && (
        <div className="bg-rose-100 border border-rose-200 text-rose-700 px-4 py-2 rounded">
          {adminError}
        </div>
      )}

      <section className="bg-white border rounded-lg p-5 space-y-4">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-slate-800">CTMT Maps</h2>
          <p className="text-sm text-slate-600">
            Add and maintain CTMT elevations for the operator rounds flow.
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
                onChange={(event) => setCtmtName(event.target.value)}
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
                onChange={(event) =>
                  void handleCtmtFile(event.target.files?.[0] ?? null)
                }
              />
              <p className="text-xs text-slate-500">
                If no image is selected, the placeholder map will be used.
              </p>
            </div>

            <button
              onClick={() => void addCtmtArea()}
              disabled={ctmtSaving}
              className={`px-4 py-2 rounded text-white font-medium ${
                ctmtSaving ? "bg-slate-400 cursor-not-allowed" : "bg-blue-600"
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

        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-slate-800">
            Update existing CTMT map
          </h3>
          <div className="flex flex-col md:flex-row gap-3 md:items-center">
            <label className="text-sm font-medium text-slate-700">
              Choose elevation
            </label>
            <select
              value={ctmtId}
              onChange={(event) => setCtmtId(event.target.value)}
              className="border rounded px-3 py-2"
            >
              <option value="">Select a CTMT map…</option>
              {ctmtAreas.map((area) => (
                <option key={area.id} value={area.id}>
                  {area.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">
              Replacement map image
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(event) =>
                void handleCtmtUpdateFile(event.target.files?.[0] ?? null)
              }
            />
            {ctmtUpdateDataUrl && (
              <div className="border rounded bg-slate-100 p-3 flex justify-center">
                <img
                  src={ctmtUpdateDataUrl}
                  alt="CTMT update preview"
                  className="max-h-64 rounded"
                />
              </div>
            )}
            {ctmtId && (
              <div>
                <p className="text-sm text-slate-600">Current map preview</p>
                <div className="border rounded bg-slate-100 p-3 flex justify-center">
                  <img
                    src={resolveMapSrc(
                      ctmtAreas.find((area) => area.id === ctmtId)?.mapPath
                    )}
                    alt="Current CTMT map"
                    className="max-h-64 rounded"
                  />
                </div>
              </div>
            )}
          </div>

          <button
            className={`px-4 py-2 rounded text-white font-medium ${
              ctmtUpdateSaving
                ? "bg-slate-400 cursor-not-allowed"
                : "bg-blue-600"
            }`}
            onClick={() => void updateSelectedCtmtMap()}
            disabled={ctmtUpdateSaving}
          >
            {ctmtUpdateSaving ? "Saving…" : "Update CTMT Map"}
          </button>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-slate-800">
            Existing CTMT maps
          </h3>
          {ctmtAreas.length === 0 ? (
            <p className="text-sm text-slate-600 mt-2">
              No CTMT maps stored yet. Add one using the form above.
            </p>
          ) : (
            <div className="mt-3 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {ctmtAreas.map((area) => (
                <div
                  key={area.id}
                  className="border rounded-lg overflow-hidden flex flex-col"
                >
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

      <section className="bg-white border rounded-lg p-5 space-y-4">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-slate-800">
            RHR / RCIC Maps
          </h2>
          <p className="text-sm text-slate-600">
            Maintain the RHR and RCIC map gallery used when operators request
            additional access.
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
                onChange={(event) => setRhrName(event.target.value)}
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
                onChange={(event) =>
                  void handleRhrFile(event.target.files?.[0] ?? null)
                }
              />
              <p className="text-xs text-slate-500">
                If no image is selected, the placeholder map will be used.
              </p>
            </div>

            <button
              onClick={() => void addRhrArea()}
              disabled={rhrSaving}
              className={`px-4 py-2 rounded text-white font-medium ${
                rhrSaving ? "bg-slate-400 cursor-not-allowed" : "bg-blue-600"
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
          <h3 className="text-lg font-semibold text-slate-800">
            Existing RHR / RCIC maps
          </h3>
          {rhrAreas.length === 0 ? (
            <p className="text-sm text-slate-600 mt-2">
              No RHR maps stored yet. Add one using the form above.
            </p>
          ) : (
            <div className="mt-3 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {rhrAreas.map((area) => (
                <div
                  key={area.id}
                  className="border rounded-lg overflow-hidden flex flex-col"
                >
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

      <section>
        <h2 className="font-semibold text-slate-800 mb-2">Entry Pending</h2>
        {pending.length === 0 ? (
          <p className="text-sm text-slate-600">
            No pending entries have been submitted.
          </p>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {pending.map((entry) => (
              <div key={entry.id} className="k-card">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{entry.areaName}</div>
                    <div className="text-xs text-slate-600">
                      {new Date(entry.timestamp).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-xs text-right">
                    <div>
                      Badges: <b>{entry.badges?.length ? entry.badges.join(", ") : "—"}</b>
                    </div>
                    <div>WO: <b>{entry.workOrder || "—"}</b></div>
                  </div>
                </div>
                {entry.mapSnapshotDataUrl && (
                  <img
                    src={entry.mapSnapshotDataUrl}
                    className="mt-2 rounded border"
                    alt={`${entry.areaName} snapshot`}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default AdminPage;
