import React, { useEffect, useMemo, useState } from "react";
import { db } from "../db/dexie";
import type { Area, EntryRecord } from "../lib/entryTypes";
import StatusChip from "../components/StatusChip";
import { downloadFile, toCSV } from "../lib/export";
import { useAuth } from "../auth/AuthContext";

const PLACEHOLDER_MAP = "/maps/placeholder.svg";

type CategoryFilter = "all" | "CTMT" | "RHR";
type StatusFilter = "all" | EntryRecord["status"];

interface QueueEntry {
  record: EntryRecord;
  area?: Area;
  category: "CTMT" | "RHR" | "Unknown";
}

const getCategoryForEntry = (entry: EntryRecord, area?: Area): QueueEntry["category"] => {
  if (area?.category) return area.category;
  if (entry.areaId.toUpperCase().startsWith("RHR")) return "RHR";
  if (entry.areaId.toUpperCase().includes("RCIC")) return "RHR";
  return "CTMT";
};

const getRoundNote = (entry: EntryRecord, category: QueueEntry["category"]): string => {
  if (entry.areaId === "CTMT_ROUND") {
    return "CTMT Only";
  }
  if (entry.areaId === "RHR_GROUP" || category === "RHR") {
    return "CTMT and RHR/RCIC";
  }
  return category === "RHR" ? "CTMT and RHR/RCIC" : "CTMT Only";
};

const AdminPage: React.FC = () => {
  const { logout } = useAuth();
  const [areas, setAreas] = useState<Area[]>([]);
  const [entries, setEntries] = useState<EntryRecord[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("entry_pending");
  const [timeWindow, setTimeWindow] = useState<number>(2);
  const [purgeDays, setPurgeDays] = useState<number>(30);
  const [ctmtName, setCtmtName] = useState("");
  const [ctmtImage, setCtmtImage] = useState<string | null>(null);
  const [rhrName, setRhrName] = useState("");
  const [rhrImage, setRhrImage] = useState<string | null>(null);
  const [editedNames, setEditedNames] = useState<Record<string, string>>({});

  const refreshAreas = async () => {
    const list = await db.areas.orderBy("name").toArray();
    setAreas(list as Area[]);
  };

  const refreshEntries = async () => {
    const rows = await db.entries.orderBy("timestamp").reverse().toArray();
    setEntries(rows as EntryRecord[]);
  };

  useEffect(() => {
    refreshAreas();
    refreshEntries();
  }, []);

  const queue: QueueEntry[] = useMemo(() => {
    return entries.map((record) => {
      const area = areas.find((item) => item.id === record.areaId);
      return {
        record,
        area,
        category: getCategoryForEntry(record, area),
      };
    });
  }, [areas, entries]);

  const filteredQueue = useMemo(() => {
    const now = Date.now();
    const windowMs = timeWindow * 60 * 60 * 1000;
    return queue.filter(({ record, category }) => {
      if (categoryFilter !== "all" && category !== categoryFilter) {
        return false;
      }
      if (statusFilter !== "all" && record.status !== statusFilter) {
        return false;
      }
      if (windowMs > 0) {
        const ts = Date.parse(record.timestamp);
        if (!Number.isFinite(ts)) {
          return false;
        }
        if (now - ts > windowMs) {
          return false;
        }
      }
      return true;
    });
  }, [queue, categoryFilter, statusFilter, timeWindow]);

  const ctmtAreas = useMemo(() => areas.filter((area) => area.category === "CTMT"), [areas]);
  const rhrAreas = useMemo(() => areas.filter((area) => area.category === "RHR"), [areas]);

  const handleFile = (file: File | null, setter: (value: string | null) => void) => {
    if (!file) {
      setter(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setter(String(reader.result || ""));
    reader.readAsDataURL(file);
  };

  const addArea = async (category: "CTMT" | "RHR", name: string, image: string | null) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const newArea: Area = {
      id: `${category}_${crypto.randomUUID()}`,
      name: trimmed,
      category,
      mapPath: image || PLACEHOLDER_MAP,
    };
    await db.areas.add(newArea);
    await refreshAreas();
  };

  const replaceAreaImage = async (areaId: string, file: File | null) => {
    if (!file) return;
    const dataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.readAsDataURL(file);
    });
    await db.areas.update(areaId, { mapPath: dataUrl });
    await refreshAreas();
  };

  const saveAreaName = async (area: Area) => {
    const nextName = (editedNames[area.id] ?? area.name).trim();
    if (!nextName) return;
    await db.areas.update(area.id, { name: nextName });
    await refreshAreas();
    setEditedNames((prev) => {
      const updated = { ...prev };
      delete updated[area.id];
      return updated;
    });
  };

  const deleteArea = async (areaId: string) => {
    await db.areas.delete(areaId);
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
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <button className="k-btn px-4 py-2" onClick={logout}>
          Logout
        </button>
      </div>

      <div className="k-card grid gap-4 md:grid-cols-4">
        <div className="space-y-2">
          <label className="text-xs uppercase text-slate-500">Category</label>
          <select
            className="border rounded px-2 py-1"
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value as CategoryFilter)}
          >
            <option value="all">All</option>
            <option value="CTMT">CTMT</option>
            <option value="RHR">RHR</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-xs uppercase text-slate-500">Status</label>
          <select
            className="border rounded px-2 py-1"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
          >
            <option value="all">All</option>
            <option value="entry_pending">Pending</option>
            <option value="ready">Ready</option>
            <option value="briefed">Briefed</option>
            <option value="entered">Entered</option>
            <option value="denied">Denied</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-xs uppercase text-slate-500">Time window</label>
          <select
            className="border rounded px-2 py-1"
            value={timeWindow}
            onChange={(event) => setTimeWindow(Number(event.target.value))}
          >
            <option value={2}>Last 2 hours</option>
            <option value={8}>Last 8 hours</option>
            <option value={24}>Last 24 hours</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-xs uppercase text-slate-500">Purge older than (days)</label>
          <div className="flex gap-2">
            <input
              type="number"
              className="border rounded px-2 py-1 w-full"
              min={0}
              value={purgeDays}
              onChange={(event) => setPurgeDays(Number(event.target.value))}
            />
            <button className="k-btn" onClick={purgeOlderThan}>
              Purge
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button className="k-btn" onClick={() => exportEntries("csv")}>Export CSV</button>
        <button className="k-btn" onClick={() => exportEntries("json")}>Export JSON</button>
      </div>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Queue</h2>
        {filteredQueue.length === 0 ? (
          <div className="k-card text-slate-600">No entries match the selected filters.</div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {filteredQueue.map(({ record, area, category }) => (
              <div key={record.id} className="k-card space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold text-lg">Ops Rounds</div>
                    <div className="text-xs text-slate-500">
                      {getRoundNote(record, category)}
                      {record.areaName ? ` • ${record.areaName}` : ""}
                    </div>
                    <div className="text-xs text-slate-500">
                      {new Date(record.timestamp).toLocaleString()}
                    </div>
                  </div>
                  <StatusChip status={record.status} />
                </div>
                <div className="text-sm text-slate-600 space-y-1">
                  <div>Work Request: {record.workRequest || "—"}</div>
                  <div>
                    Badges: {(record.badges && record.badges.length > 0
                      ? record.badges
                      : record.badgesMasked || [])
                      .join(", ") || "—"}
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

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">CTMT Maps</h2>
        <div className="k-card space-y-3">
          <div className="grid md:grid-cols-3 gap-3">
            <input
              className="border rounded px-3 py-2"
              placeholder="Name"
              value={ctmtName}
              onChange={(event) => setCtmtName(event.target.value)}
            />
            <input
              type="file"
              accept="image/*"
              onChange={(event) => handleFile(event.target.files?.[0] || null, setCtmtImage)}
            />
            <button
              className="k-btn"
              onClick={async () => {
                await addArea("CTMT", ctmtName, ctmtImage);
                setCtmtName("");
                setCtmtImage(null);
              }}
            >
              Add CTMT Map
            </button>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {ctmtAreas.map((area) => (
            <div key={area.id} className="k-card space-y-3">
              <input
                className="border rounded px-3 py-2 w-full"
                value={editedNames[area.id] ?? area.name}
                onChange={(event) =>
                  setEditedNames((prev) => ({ ...prev, [area.id]: event.target.value }))
                }
              />
              <img
                src={area.mapPath || PLACEHOLDER_MAP}
                alt={area.name}
                className="rounded border max-h-56 object-contain"
              />
              <div className="flex flex-wrap gap-2">
                <label className="k-btn cursor-pointer">
                  Replace Image
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => replaceAreaImage(area.id, event.target.files?.[0] || null)}
                  />
                </label>
                <button className="k-btn" onClick={() => saveAreaName(area)}>
                  Save Name
                </button>
                <button className="k-btn" onClick={() => deleteArea(area.id)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">RHR / RCIC Maps</h2>
        <div className="k-card space-y-3">
          <div className="grid md:grid-cols-3 gap-3">
            <input
              className="border rounded px-3 py-2"
              placeholder="Name"
              value={rhrName}
              onChange={(event) => setRhrName(event.target.value)}
            />
            <input
              type="file"
              accept="image/*"
              onChange={(event) => handleFile(event.target.files?.[0] || null, setRhrImage)}
            />
            <button
              className="k-btn"
              onClick={async () => {
                await addArea("RHR", rhrName, rhrImage);
                setRhrName("");
                setRhrImage(null);
              }}
            >
              Add RHR Map
            </button>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {rhrAreas.map((area) => (
            <div key={area.id} className="k-card space-y-3">
              <input
                className="border rounded px-3 py-2 w-full"
                value={editedNames[area.id] ?? area.name}
                onChange={(event) =>
                  setEditedNames((prev) => ({ ...prev, [area.id]: event.target.value }))
                }
              />
              <img
                src={area.mapPath || PLACEHOLDER_MAP}
                alt={area.name}
                className="rounded border max-h-56 object-contain"
              />
              <div className="flex flex-wrap gap-2">
                <label className="k-btn cursor-pointer">
                  Replace Image
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => replaceAreaImage(area.id, event.target.files?.[0] || null)}
                  />
                </label>
                <button className="k-btn" onClick={() => saveAreaName(area)}>
                  Save Name
                </button>
                <button className="k-btn" onClick={() => deleteArea(area.id)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default AdminPage;
