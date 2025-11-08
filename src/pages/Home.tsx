// src/pages/Home.tsx
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import areasJson from "../data/mock_areas.json";
import { db } from "../db/dexie";
import { seedMock } from "../db/seed";
import type { Area, EntryRecord } from "../lib/entryTypes";

type AreaSeed = { ctmt: Area[]; rhr: Area[] };

const FALLBACK_CTMT: Area[] = ((areasJson as unknown as AreaSeed).ctmt || []).map(
  (area) => ({
    ...area,
    category: area.category ?? "CTMT",
    mapPath: area.mapPath || "/maps/placeholder.svg",
  })
);

const Home: React.FC = () => {
  const nav = useNavigate();
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rhrChoice, setRhrChoice] = useState<"yes" | "no" | null>(null);

  const loadAreas = async () => {
    setLoading(true);
    setError(null);

    try {
      let list = await db.areas.where("category").equals("CTMT").sortBy("name");

      if (list.length === 0) {
        const count = await db.areas.count();
        if (count === 0) {
          await seedMock();
        }
        list = await db.areas.where("category").equals("CTMT").sortBy("name");
      }

      if (list.length === 0) {
        const fallback = [...FALLBACK_CTMT];
        fallback.sort((a, b) => a.name.localeCompare(b.name));
        setAreas(fallback);
      } else {
        const normalized = list.map((area) => ({
          ...area,
          mapPath: area.mapPath || "/maps/placeholder.svg",
          category: area.category ?? "CTMT",
        }));
        setAreas(normalized);
      }
    } catch (err) {
      console.error("Failed to load CTMT maps", err);
      setError("Unable to load CTMT maps. Showing defaults.");
      const fallback = [...FALLBACK_CTMT];
      fallback.sort((a, b) => a.name.localeCompare(b.name));
      setAreas(fallback);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAreas();
  }, []);

  const onContinue = async () => {
    if (rhrChoice === "yes") {
      nav("/rhr");
      return;
    }
    // rhrChoice === "no" — record an entry and finish
    const rec: EntryRecord = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      areaId: "CTMT_ROUND",
      areaName: "CTMT Group (RHR/RCIC: No)",
      spX: 0.5,
      spY: 0.5,
      status: "entry_pending",
      badges: [],
    };
    await db.entries.add(rec);
    nav("/thanks");
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary">Select CTMT Elevation</h1>
        <div className="text-sm space-x-3">
          <Link to="/" className="k-btn px-4 py-2">Home</Link>
          <Link to="/admin" className="k-btn px-4 py-2">Admin</Link>
        </div>
      </div>

      {loading ? (
        <div className="k-card">Loading…</div>
      ) : (
        <>
          {error && (
            <div className="k-card border-amber-300 bg-amber-50 text-amber-700">
              {error}
            </div>
          )}

          {areas.length === 0 ? (
            <div className="k-card text-center text-slate-600">
              No CTMT maps available. Please upload maps via the Admin page.
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {areas.map((area) => (
                <div key={area.id} className="k-card p-0 overflow-hidden">
                  <div className="px-4 py-3 border-b">
                    <h2 className="font-semibold text-slate-800">{area.name}</h2>
                  </div>
                  <div className="p-4 bg-slate-50">
                    <img
                      src={area.mapPath || "/maps/placeholder.svg"}
                      alt={area.name}
                      className="w-full rounded-md border object-contain max-h-80"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* RHR/RCIC prompt with ONE Continue button */}
          <div className="k-card space-y-3">
            <p className="font-medium">RHR/RCIC?</p>
            <div className="flex items-center gap-6">
              <label className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  name="rhr"
                  checked={rhrChoice === "no"}
                  onChange={() => setRhrChoice("no")}
                />
                <span>No</span>
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  name="rhr"
                  checked={rhrChoice === "yes"}
                  onChange={() => setRhrChoice("yes")}
                />
                <span>Yes</span>
              </label>
            </div>

            <div className="flex justify-start pt-1">
              <button
                className={`k-btn ${!rhrChoice ? "opacity-60 cursor-not-allowed" : ""}`}
                disabled={!rhrChoice}
                onClick={onContinue}
              >
                Continue
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Home;
