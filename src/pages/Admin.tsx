import React, { useEffect, useMemo, useState } from "react";
import { db } from "../db/dexie";
import type { Area, EntryRecord, EntryStatus } from "../lib/entryTypes";
import { seedMock } from "../db/seed";
import StatusChip from "../components/StatusChip";
import { downloadFile, toCSV } from "../lib/export";
import { useAuth } from "../auth/AuthContext";

const PLACEHOLDER_SRC = "/maps/placeholder.svg";

const fileToDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error ?? new Error("Unable to read file"));
    reader.readAsDataURL(file);
  });

const resolveMapSrc = (path?: string | null) =>
  path && path.length > 0 ? path : PLACEHOLDER_SRC;

const STATUS_OPTIONS: (EntryStatus | "all")[] = [
  "all",
  "entry_pending",
  "ready",
  "briefed",
  "entered",
  "denied",
];

const AdminPage: React.FC = () => {
  const { logout } = useAuth();

  const [areas, setAreas] = useState<Area[]>([]);
  const [entries, setEntries] = useState<EntryRecord[]>([]);
  const [statusFilter, setStatusFilter] = useState<EntryStatus | "all">(
    "entry_pending"
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [purgeDays, setPurgeDays] = useState<number>(30);

  const [ctmtName, setCtmtName] = useState("");
  const [ctmtImage, setCtmtImage] = useState<string | null>(null);
  const [ctmtSaving, setCtmtSaving] = useState(false);
  const [ctmtUpdateId, setCtmtUpdateId] = useState<string>("");
  const [ctmtUpdateDataUrl, setCtmtUpdateDataUrl] = useState<string | null>(null);

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

  const filteredQueue = useMemo(() => {
    const needle = searchTerm.trim().toLowerCase();
    return entries.filter((entry) => {
      const statusMatch = statusFilter === "all" || entry.status === statusFilter;
      if (!statusMatch) {
        return false;
      }
      if (needle.length === 0) {
        return true;
      }
      const haystack = [
        entry.areaName,
        entry.workRequest ?? "",
        (entry.badges ?? []).join(" "),
        entry.planningNote ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [entries, searchTerm, statusFilter]);

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
      if (normalized.length > 0 && !ctmtUpdateId) {
        const firstCtmt = normalized.find((area) => area.category === "CTMT");
        if (firstCtmt) {
          setCtmtUpdateId(firstCtmt.id);
        }
      }
    } catch (error) {
      console.error("Failed to load areas", error);
      setAdminError("Unable to load maps. Please retry.");
    }
  };

  const loadEntries = async () => {
    try {
      const list = await db.entries.orderBy("timestamp").reverse().toArray();
      setEntries(list as EntryRecord[]);
    } catch (error) {
      console.error("Failed to load entries", error);
      setAdminError("Unable to load entry queue. Please retry.");
    }
  };

  useEffect(() => {
    void loadAreas();
    void loadEntries();
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
      setAdminError("Unable to read the CTMT image. Please try another file.");
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
      setAdminError("Unable to read the replacement image. Please try another file.");
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
      setAdminError("Unable to read the RHR image. Please try another file.");
    }
  };

  const addCtmtArea = async () => {
    const trimmed = ctmtName.trim();
    if (trimmed.length === 0) {
      setAdminError("Provide a CTMT map name before saving.");
      return;
    }
    setAdminError(null);
    setCtmtSaving(true);
    try {
      await db.areas.add({
        id: `CT_${crypto.randomUUID()}`,
        name: trimmed,
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

  const updateCtmtMap = async () => {
    if (!ctmtUpdateId) {
      setAdminError("Choose a CTMT map before uploading a replacement image.");
      return;
    }
    if (!ctmtUpdateDataUrl) {
      setAdminError("Upload a new image before saving the CTMT map.");
      return;
    }
    setAdminError(null);
    try {
      await db.areas.update(ctmtUpdateId, { mapPath: ctmtUpdateDataUrl });
      setCtmtUpdateDataUrl(null);
      await loadAreas();
    } catch (error) {
      console.error("Failed to update CTMT map", error);
      setAdminError("Unable to update CTMT map. Please retry.");
    }
  };

  const addRhrArea = async () => {
    const trimmed = rhrName.trim();
    if (trimmed.length === 0) {
      setAdminError("Provide an RHR map name before saving.");
      return;
    }
    setAdminError(null);
    setRhrSaving(true);
    try {
      await db.areas.add({
        id: `RHR_${crypto.randomUUID()}`,
        name: trimmed,
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
      await db.areas.delete(area.id);
      await loadAreas();
    } catch (error) {
      console.error("Failed to delete map", error);
      setAdminError("Unable to delete map. Please retry.");
    } finally {
      setDeletingId(null);
    }
  };

  const markStatus = async (id: string, next: EntryStatus) => {
    try {
      await db.entries.update(id, { status: next });
      await loadEntries();
    } catch (error) {
      console.error("Failed to update entry status", error);
      setAdminError("Unable to update entry status. Please retry.");
    }
  };

  const exportEntries = async (format: "csv" | "json") => {
    if (filteredQueue.length === 0) {
      return;
    }
    const nowIso = new Date().toISOString();
    const selected = filteredQueue.map((item) => item);

    if (format === "csv") {
      const csv = toCSV(selected);
      downloadFile(`hra-entries-${nowIso}.csv`, csv, "text/csv");
    } else {
      const data = JSON.stringify(selected, null, 2);
      downloadFile(`hra-entries-${nowIso}.json`, data, "application/json");
    }

    try {
      await db.entries.bulkPut(
        selected.map((entry) => ({ ...entry, exportedAt: nowIso }))
      );
      await loadEntries();
    } catch (error) {
      console.error("Failed to update export timestamps", error);
      setAdminError("Export succeeded but updating records failed. Please refresh.");
    }
  };

  const purgeOlderThan = async () => {
    const days = Math.max(0, purgeDays);
    if (days <= 0) {
      setAdminError("Provide a purge window in days (greater than zero).");
      return;
    }
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    const toDelete = entries
      .filter((entry) => Date.parse(entry.timestamp) < cutoff)
      .map((entry) => entry.id);
    if (toDelete.length === 0) {
      setAdminError(`No entries older than ${days} day(s) were found.`);
      return;
    }
    const confirmed = window.confirm(
      `Delete ${toDelete.length} entr${toDelete.length === 1 ? "y" : "ies"} older than ${days} day(s)?`
    );
    if (!confirmed) {
      return;
    }
    setAdminError(null);
    try {
      await db.entries.bulkDelete(toDelete);
      await loadEntries();
    } catch (error) {
      console.error("Failed to purge old entries", error);
      setAdminError("Unable to purge entries. Please retry.");
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
      await loadEntries();
    } catch (error) {
      console.error("Failed to clear entries", error);
      setAdminError("Unable to clear entries. Please retry.");
    }
  };

  const onSeed = async () => {
    try {
      await seedMock();
      await loadAreas();
    } catch (error) {
      console.error("Failed to seed maps", error);
      setAdminError("Unable to seed maps. Please retry.");
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold">Admin</h1>
        <button onClick={logout} className="k-btn px-4 py-2 self-start md:self-auto">
          Logout
        </button>
      </div>

      <div className="k-card flex flex-wrap gap-3">
        <button className="k-btn" onClick={() => void onSeed()}>Seed CTMT defaults</button>
        <button className="k-btn" onClick={() => void loadAreas()}>Reload Areas</button>
        <button className="k-btn" onClick={() => void loadEntries()}>Refresh Queue</button>
        <button className="k-btn" onClick={() => void clearEntries()}>Clear All Entries</button>
      </div>

      {adminError && (
        <div className="bg-rose-100 border border-rose-200 text-rose-700 px-4 py-2 rounded">
          {adminError}
        </div>
      )}

      <section className="bg-white border rounded-lg p-5 space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-slate-800">Entry queue</h2>
            <p className="text-sm text-slate-600">
              Filter the entry queue, export records, and update crew status as teams progress.
            </p>
          </div>

          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <label className="text-sm font-medium text-slate-700">
              Status
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as EntryStatus | "all")}
                className="mt-1 border rounded px-3 py-2 w-full md:ml-2 md:mt-0"
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status === "all" ? "All" : status.replace("_", " ")}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm font-medium text-slate-700">
              Search
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="mt-1 border rounded px-3 py-2 w-full md:ml-2 md:mt-0"
                placeholder="Area, work request, or badge"
              />
            </label>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button className="k-btn" onClick={() => void exportEntries("csv")}>
            Export filtered to CSV
          </button>
          <button className="k-btn" onClick={() => void exportEntries("json")}>
            Export filtered to JSON
          </button>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="purgeDays">
              Purge older than (days)
            </label>
            <input
              id="purgeDays"
              type="number"
              min={1}
              value={purgeDays}
              onChange={(event) => setPurgeDays(Number(event.target.value))}
              className="border rounded px-2 py-1 w-24"
            />
            <button className="k-btn" onClick={() => void purgeOlderThan()}>
              Purge
            </button>
          </div>
        </div>

        {filteredQueue.length === 0 ? (
          <p className="text-sm text-slate-600">
            No entries match the current filters.
          </p>
        ) : (
          <div className="space-y-4">
            {filteredQueue.map((entry) => (
              <article key={entry.id} className="k-card space-y-3">
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-800">{entry.areaName}</h3>
                    <p className="text-xs text-slate-600">
                      {new Date(entry.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusChip status={entry.status} />
                    {entry.exportedAt && (
                      <span className="text-xs text-slate-500">
                        Exported {new Date(entry.exportedAt).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid gap-2 md:grid-cols-2">
                  <div className="space-y-1 text-sm">
                    <div>
                      <span className="font-medium">Work Request:</span> {entry.workRequest || "—"}
                    </div>
                    <div>
                      <span className="font-medium">Badges:</span>{" "}
                      {entry.badges?.length ? entry.badges.join(", ") : "—"}
                    </div>
                    {entry.planningNote && (
                      <div>
                        <span className="font-medium">Planning note:</span> {entry.planningNote}
                      </div>
                    )}
                    {entry.overheadNeeded !== undefined && (
                      <div>
                        <span className="font-medium">Overhead:</span>{" "}
                        {entry.overheadNeeded
                          ? `Yes${entry.overheadHeight ? ` (${entry.overheadHeight} ft)` : ""}`
                          : "No"}
                      </div>
                    )}
                  </div>

                  {entry.mapSnapshotDataUrl && (
                    <div className="flex justify-center">
                      <img
                        src={entry.mapSnapshotDataUrl}
                        alt={`${entry.areaName} snapshot`}
                        className="rounded border max-h-48 object-contain"
                      />
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <button className="k-btn" onClick={() => void markStatus(entry.id, "ready")}>
                    Mark Ready
                  </button>
                  <button className="k-btn" onClick={() => void markStatus(entry.id, "briefed")}>
                    Mark Briefed
                  </button>
                  <button className="k-btn" onClick={() => void markStatus(entry.id, "entered")}>
                    Mark Entered
                  </button>
                  <button className="k-btn" onClick={() => void markStatus(entry.id, "denied")}>
                    Deny
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="bg-white border rounded-lg p-5 space-y-4">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-slate-800">CTMT Maps</h2>
          <p className="text-sm text-slate-600">
            Add CTMT elevations, upload replacement images, and manage the library used in the operator flow.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700">
                New CTMT map name
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
                onChange={(event) => void handleCtmtFile(event.target.files?.[0] ?? null)}
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
          <h3 className="text-lg font-semibold text-slate-800">Update existing CTMT map</h3>
          <div className="flex flex-col md:flex-row gap-3 md:items-center">
            <label className="text-sm font-medium text-slate-700">Choose elevation</label>
            <select
              value={ctmtUpdateId}
              onChange={(event) => setCtmtUpdateId(event.target.value)}
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

          <div className="grid gap-4 md:grid-cols-2">
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
            </div>

            {ctmtUpdateId && (
              <div>
                <p className="text-sm text-slate-600">Current map preview</p>
                <div className="border rounded bg-slate-100 p-3 flex justify-center">
                  <img
                    src={resolveMapSrc(
                      ctmtAreas.find((area) => area.id === ctmtUpdateId)?.mapPath
                    )}
                    alt="Current CTMT map"
                    className="max-h-64 rounded"
                  />
                </div>
              </div>
            )}
          </div>

          <button className="k-btn" onClick={() => void updateCtmtMap()}>
            Update CTMT Map
          </button>
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
                onChange={(event) => void handleRhrFile(event.target.files?.[0] ?? null)}
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
          <h3 className="text-lg font-semibold text-slate-800">Existing RHR / RCIC maps</h3>
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

    </div>
  );
};

export default AdminPage;
