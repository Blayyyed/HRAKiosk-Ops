// src/pages/RHR.tsx
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { db } from "../db/dexie";

type Area = {
  id: string;
  name: string;
  mapPath?: string;
  category?: "CTMT" | "RHR";
};

const RHR: React.FC = () => {
  const nav = useNavigate();
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAreas = async () => {
    setLoading(true);
    const list = await db.areas.where("category").equals("RHR").sortBy("name");
    setAreas(list as Area[]);
    setLoading(false);
  };

  useEffect(() => {
    loadAreas();
  }, []);

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary">RHR / RCIC Maps</h1>
        <div className="text-sm space-x-3">
          <Link to="/ctmt" className="k-btn px-4 py-2">Back to CTMT</Link>
          <Link to="/admin" className="k-btn px-4 py-2">Admin</Link>
        </div>
      </div>

      {loading ? (
        <div className="k-card">Loading…</div>
      ) : areas.length === 0 ? (
        <div className="k-card">
          No RHR/RCIC maps yet. Use Admin to create and upload new maps.
        </div>
      ) : (
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
              <div className="mt-3 text-sm text-slate-600">
                {a.mapPath?.startsWith("data:")
                  ? "Custom map uploaded"
                  : "Using placeholder map (upload in Admin)"}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default RHR;