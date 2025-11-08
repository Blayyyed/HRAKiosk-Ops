import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { db } from "../db/dexie";
import areasJson from "../data/mock_areas.json";

type Area = {
  id: string;
  name: string;
  elevation?: string;
  mapPath?: string; // can be /maps/*.png or data URL
};

type AreaSeed = { ctmt: Area[]; rhr: Area[] };

const STATIC_AREAS: Area[] = (
  ((areasJson as unknown as AreaSeed).ctmt || []).concat(
    (areasJson as unknown as AreaSeed).rhr || []
  )
).map((area) => ({
  ...area,
  mapPath: area.mapPath || "/maps/placeholder.svg",
}));

const CANVAS_MAX_WIDTH = 960;

const MapSelect: React.FC = () => {
  // ✅ MUST be areaId because route is /map/:areaId
  const { areaId = "" } = useParams();
  const nav = useNavigate();

  const [area, setArea] = useState<Area | undefined>(undefined);
  const [status, setStatus] = useState<"loading" | "ready" | "no-area">("loading");

  // Canvas and image refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Relative pin position (0..1)
  const [pin, setPin] = useState<{ x: number; y: number } | null>(null);

  // ──────────────────────────────────────────────
  // Load area: Dexie first, fallback to JSON
  // ──────────────────────────────────────────────
  useEffect(() => {
    let active = true;

    const load = async () => {
      setStatus("loading");
      try {
        const fromDb = await db.areas.get(String(areaId));
        if (active && fromDb) {
          setArea({
            id: fromDb.id,
            name: fromDb.name,
            elevation: (fromDb as any).elevation,
            mapPath: (fromDb as any).mapPath,
          });
          setStatus("ready");
          return;
        }
        // fallback to static JSON
        const fromJson = STATIC_AREAS.find((a) => String(a.id) === String(areaId));
        if (active && fromJson) {
          setArea(fromJson);
          setStatus("ready");
          return;
        }

        if (active) {
          setArea(undefined);
          setStatus("no-area");
        }
      } catch {
        if (active) {
          setArea(undefined);
          setStatus("no-area");
        }
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [areaId]);

  // Compute final image path for drawing
  const imagePath = useMemo(() => {
    if (!area) return "/maps/dw-misc.png";
    const src = area.mapPath || "/maps/dw-misc.png";
    if (src.startsWith("data:")) return src; // data URL from Update Maps
    if (src.startsWith("/maps/")) return src; // already in public root
    return `/maps/${src.replace(/^\/+/, "")}`;
  }, [area]);

  // ──────────────────────────────────────────────
  // Draw image (and pin) whenever image/pin changes
  // ──────────────────────────────────────────────
  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const img = imgRef.current;
    if (!img) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Fit width but preserve aspect
    const scale = Math.min(1, CANVAS_MAX_WIDTH / img.width);
    const w = Math.floor(img.width * scale);
    const h = Math.floor(img.height * scale);

    canvas.width = w;
    canvas.height = h;

    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);

    // Draw pin if set
    if (pin) {
      const px = pin.x * w;
      const py = pin.y * h;
      ctx.save();
      ctx.beginPath();
      ctx.arc(px, py, 6, 0, Math.PI * 2);
      ctx.fillStyle = "#ef4444"; // rose-500
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#7f1d1d";
      ctx.stroke();
      ctx.restore();
    }
  };

  // Load <img> and draw (initial)
  useEffect(() => {
    if (status !== "ready") return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imgRef.current = img;
      draw();
    };
    img.src = imagePath;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imagePath, status]);

  // Redraw when pin changes (and image already loaded)
  useEffect(() => {
    draw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  // Handle map click → store relative coordinates and draw pin
  const onCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const rx = Math.min(1, Math.max(0, x));
    const ry = Math.min(1, Math.max(0, y));
    setPin({ x: rx, y: ry });
  };

  const pinSelected = !!pin;
  const readyToContinue = status === "ready" && pinSelected;

  // Continue → Finalize (snapshot + fields)
  const onContinue = () => {
    const canvas = canvasRef.current;
    const snapshot = canvas?.toDataURL("image/png");
    nav(`/final/${areaId}`, {
      state: {
        areaId,
        areaName: area?.name || "Area",
        mapPin: pin,
        mapSnapshotDataUrl: snapshot,
      },
    });
  };

  if (status === "no-area") {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="k-title text-primary mb-2">Map Select</h1>
        <p>Area not found. <Link to="/areas" className="k-btn px-4 py-2 ml-2">Back to Areas</Link></p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="k-title text-primary">
          {status === "ready" ? area?.name : "Loading…"}
        </h1>
        <div className="text-sm flex gap-3">
          <Link to="/areas" className="k-btn px-4 py-2">Back</Link>
          <Link to="/admin" className="k-btn px-4 py-2">Admin</Link>
        </div>
      </div>

      <div className="k-card">
        <canvas
          ref={canvasRef}
          onClick={onCanvasClick}
          className="w-full bg-slate-200 rounded"
          style={{ cursor: "crosshair", minHeight: 320 }}
        />
        {!pinSelected && (
          <p className="text-sm text-slate-600 mt-2">
            Click on the map to mark your work location.
          </p>
        )}
      </div>

      <div className="flex justify-end">
        <button
          onClick={onContinue}
          disabled={!readyToContinue}
          className={`k-btn ${!readyToContinue ? "opacity-60 cursor-not-allowed" : ""}`}
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default MapSelect;