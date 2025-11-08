import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import areasJson from "../data/mock_areas.json";
import { db } from "../db/dexie";
import { seedMock } from "../db/seed";
import type { Area, EntryRecord } from "../lib/entryTypes";
import { useOperatorFlow } from "../contexts/OperatorContext";
import MapLightbox from "../components/MapLightbox";
import { hashBadge, maskBadge } from "../lib/crypto";

type AreaSeed = { ctmt: Area[] };

const FALLBACK_CTMT: Area[] = ((areasJson as unknown as AreaSeed).ctmt || []).map((area) => ({
  ...area,
  category: "CTMT",
  mapPath: area.mapPath || "/maps/placeholder.svg",
}));

const isCustomMap = (mapPath: string): boolean => mapPath.startsWith("data:");

const CTMTScroll: React.FC = () => {
  const navigate = useNavigate();
  const { acks, updateDraft, clearAcks, crew, clearCrew } = useOperatorFlow();
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rhrChoice, setRhrChoice] = useState<"yes" | "no" | null>(null);
  const [preview, setPreview] = useState<{ title: string; image: string } | null>(null);
  const [flowError, setFlowError] = useState<string | null>(null);

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
        let list = await db.areas.where("category").equals("CTMT").sortBy("name");
        if (list.length === 0) {
          const count = await db.areas.count();
          if (count === 0) {
            await seedMock();
            list = await db.areas.where("category").equals("CTMT").sortBy("name");
          }
        }
        if (!active) return;
        if (list.length === 0) {
          setAreas([...FALLBACK_CTMT]);
        } else {
          setAreas(
            list.map((area) => ({
              ...area,
              category: "CTMT",
              mapPath: area.mapPath || "/maps/placeholder.svg",
            }))
          );
        }
      } catch (err) {
        console.error("Failed to load CTMT maps", err);
        if (!active) return;
        setError("Unable to load CTMT maps. Showing defaults.");
        setAreas([...FALLBACK_CTMT]);
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

  const onContinue = async () => {
    if (rhrChoice === "yes") {
      updateDraft({ areaId: "RHR_GROUP", areaName: "RHR/RCIC Group" });
      navigate("/rhr");
      return;
    }
    if (rhrChoice === "no") {
      if (!crew || crew.badges.length === 0 || crew.workRequest.trim().length === 0) {
        setFlowError("Work Request and crew badges are required. Please complete the acknowledgement step.");
        navigate("/ack");
        return;
      }
      setFlowError(null);
      const normalizedBadges = crew.badges.map((badge) => badge.trim()).filter((badge) => badge.length > 0);
      if (normalizedBadges.length === 0) {
        setFlowError("Crew badges are missing. Please re-enter them.");
        navigate("/ack");
        return;
      }
      const maskedBadges = normalizedBadges.map((badge) => maskBadge(badge));
      const hashedBadges = await Promise.all(normalizedBadges.map((badge) => hashBadge(badge)));
      const record: EntryRecord = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        areaId: "CTMT_ROUND",
        areaName: "CTMT Group (RHR/RCIC: No)",
        status: "entry_pending",
        badges: normalizedBadges,
        badgesMasked: maskedBadges,
        badgesHashed: hashedBadges,
        workRequest: crew.workRequest,
        acks: acks ?? undefined,
      };
      await db.entries.add(record);
      updateDraft(null);
      clearAcks();
      clearCrew();
      navigate("/thanks");
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-primary">CTMT Maps</h1>
        <p className="text-slate-600">
          Scroll to review all elevations. Updated uploads show as custom maps.
        </p>
      </div>

      {loading ? (
        <div className="k-card">Loading…</div>
      ) : (
        <>
          {error && (
            <div className="k-card border-amber-300 bg-amber-50 text-amber-700">{error}</div>
          )}
          {flowError && (
            <div className="k-card border-rose-300 bg-rose-50 text-rose-700">{flowError}</div>
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
                <div className="p-4 bg-slate-50 space-y-2">
                  <button
                    type="button"
                    className="block w-full"
                    onClick={() => setPreview({ title: area.name, image: area.mapPath })}
                    aria-label={`Enlarge ${area.name} map`}
                  >
                    <img
                      src={area.mapPath}
                      alt={area.name}
                      className="w-full rounded-md border object-contain max-h-96 cursor-zoom-in"
                    />
                  </button>
                  <p className="text-xs text-slate-500 text-center">Tap to enlarge</p>
                </div>
              </div>
            ))}
          </div>

          <div className="k-card space-y-3">
            <p className="font-medium">RHR/RCIC access needed?</p>
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
            <div>
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
      {preview && (
        <MapLightbox
          open
          title={preview.title}
          imageSrc={preview.image}
          onClose={() => setPreview(null)}
        />
      )}
    </div>
  );
};

export default CTMTScroll;
