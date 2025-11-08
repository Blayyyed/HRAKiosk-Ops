// src/pages/Home.tsx
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { db } from "../db/dexie";
import { seedMock } from "../db/seed";
import type { EntryRecord } from "../lib/entryTypes";

type Area = {
  id: string;
  name: string;
  mapPath?: string;
  category?: "CTMT" | "RHR";
};

const Home: React.FC = () => {
  const nav = useNavigate();
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [rhrChoice, setRhrChoice] = useState<"yes" | "no" | null>(null);

  const loadAreas = async () => {
    setLoading(true);
    const count = await db.areas.count();
    if (count === 0) {
      await seedMock();
    }
    const list = await db.areas.where("category").equals("CTMT").sortBy("name");
    setAreas(list as Area[]);
    setLoading(false);
  };

  useEffect(() => {
    loadAreas();
  }, []);

  const onContinue = async () => {
    if (rhrChoice === "yes") {
      nav("/rhr");
      return;
    }
    // rhrChoice === "no"
   const rec: EntryRecord = {
  id: crypto.randomUUID(),
  timestamp: new Date().toISOString(),
  areaId: "CTMT_ROUND",
  areaName: "CTMT Group (RHR/RCIC: No)",
  spotX: 0.5,
  spotY: 0.5,
  status: "entry_pending",
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
          <div className="grid md:grid-cols-2 gap-4">
            {areas.map((a) => (
              <button
                key={a.id}
                onClick={() => nav(`/map/${a.id}`)}
                className="k-card text-left hover:shadow-lg transition"
              >
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-slate-800">{a.name}</div>
                  <span className="text-xs text-slate-500">Tap to open</span>
                </div>
              </button>
            ))}
          </div>

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
