import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import areasJson from "../data/mock_areas.json";
import { db } from "../db/dexie";
import type { Area } from "../lib/entryTypes";
import { useOperatorFlow } from "../contexts/OperatorContext";

const FALLBACK_RHR: Area[] = ((areasJson as unknown as { rhr: Area[] }).rhr || []).map((area) => ({
  ...area,
  category: "RHR",
  mapPath: area.mapPath || "/maps/placeholder.svg",
}));

const isCustomMap = (mapPath: string): boolean => mapPath.startsWith("data:");

const RHRScroll: React.FC = () => {
  const navigate = useNavigate();
  const { acks, updateDraft } = useOperatorFlow();
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!acks) {
      navigate("/ack", { replace: true });
    }
  }, [acks, navigate]);

  useEffect(() => {
    let active = true;
    const loadAreas = async () => {
      setLoading(true);
      setError(null);
      try {
        const list = await db.areas.where("category").equals("RHR").sortBy("name");
        if (!active) return;
        if (list.length === 0) {
          setAreas([...FALLBACK_RHR]);
        } else {
          setAreas(
            list.map((area) => ({
              ...area,
              category: "RHR",
              mapPath: area.mapPath || "/maps/placeholder.svg",
            }))
          );
        }
      } catch (err) {
        console.error("Failed to load RHR maps", err);
        if (!active) return;
        setError("Unable to load RHR/RCIC maps. Showing defaults.");
        setAreas([...FALLBACK_RHR]);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadAreas();
    return () => {
      active = false;
    };
  }, []);

  const continueToFinalize = () => {
    updateDraft({ areaId: "RHR_GROUP", areaName: "RHR/RCIC Group" });
    navigate("/finalize");
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-primary">RHR / RCIC Maps</h1>
        <p className="text-slate-600">Review all available RHR/RCIC layouts before finalizing your crew details.</p>
      </div>

      {loading ? (
        <div className="k-card">Loading…</div>
      ) : (
        <>
          {error && (
            <div className="k-card border-amber-300 bg-amber-50 text-amber-700">{error}</div>
          )}
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {areas.map((area) => (
              <div key={area.id} className="k-card p-0 overflow-hidden">
                <div className="px-4 py-3 border-b flex items-center justify-between">
                  <h2 className="font-semibold text-slate-800">{area.name}</h2>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      isCustomMap(area.mapPath)
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {isCustomMap(area.mapPath) ? "Custom map" : "Default"}
                  </span>
                </div>
                <div className="p-4 bg-slate-50">
                  <img
                    src={area.mapPath}
                    alt={area.name}
                    className="w-full rounded-md border object-contain max-h-80"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end">
            <button className="k-btn" onClick={continueToFinalize}>
              Continue
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default RHRScroll;
