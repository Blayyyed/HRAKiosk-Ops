import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { db } from "../db/dexie";
import areasJson from "../data/mock_areas.json";
import type { Area } from "../lib/entryTypes";
import { useOperatorFlow } from "../contexts/OperatorContext";

const areaSeed = areasJson as unknown as { ctmt?: Area[]; rhr?: Area[] };
const STATIC_AREAS: Area[] = [...(areaSeed.ctmt || []), ...(areaSeed.rhr || [])].map((area) => ({
  ...area,
  category: area.category ?? "CTMT",
  mapPath: area.mapPath || "/maps/placeholder.svg",
}));

const CANVAS_MAX_WIDTH = 960;

const MapSelect: React.FC = () => {
  const { areaId = "" } = useParams();
  const navigate = useNavigate();
  const { updateDraft, acks } = useOperatorFlow();

  const [area, setArea] = useState<Area | undefined>(undefined);
  const [status, setStatus] = useState<"loading" | "ready" | "no-area">("loading");

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const clearTimer = useRef<number | null>(null);

  const [pin, setPin] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!acks) {
      navigate("/ack", { replace: true });
    }
  }, [acks, navigate]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setStatus("loading");
      try {
        const fromDb = await db.areas.get(String(areaId));
        if (active && fromDb) {
          setArea({
            ...fromDb,
            mapPath: fromDb.mapPath || "/maps/placeholder.svg",
          });
          setStatus("ready");
          return;
        }
        const fallback = STATIC_AREAS.find((item) => item.id === areaId);
        if (active && fallback) {
          setArea(fallback);
          setStatus("ready");
          return;
        }
        if (active) {
          setArea(undefined);
          setStatus("no-area");
        }
      } catch (err) {
        console.error("Failed to load area", err);
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

  const imagePath = useMemo(() => {
    if (!area) return "/maps/placeholder.svg";
    const src = area.mapPath || "/maps/placeholder.svg";
    if (src.startsWith("data:")) return src;
    if (src.startsWith("/maps/")) return src;
    return `/maps/${src.replace(/^\/+/, "")}`;
  }, [area]);

  const draw = () => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const scale = Math.min(1, CANVAS_MAX_WIDTH / img.width);
    const width = Math.floor(img.width * scale);
    const height = Math.floor(img.height * scale);
    canvas.width = width;
    canvas.height = height;
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);

    if (pin) {
      const px = pin.x * width;
      const py = pin.y * height;
      ctx.save();
      ctx.beginPath();
      ctx.arc(px, py, 6, 0, Math.PI * 2);
      ctx.fillStyle = "#ef4444";
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#7f1d1d";
      ctx.stroke();
      ctx.restore();
    }
  };

  useEffect(() => {
    if (status !== "ready") return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imgRef.current = img;
      draw();
    };
    img.src = imagePath;
  }, [imagePath, status]);

  useEffect(() => {
    draw();
  }, [pin]);

  const onCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    const clamp = (value: number) => Math.min(1, Math.max(0, value));
    setPin({ x: clamp(x), y: clamp(y) });
  };

  const startClearTimer = () => {
    if (clearTimer.current) {
      window.clearTimeout(clearTimer.current);
    }
    clearTimer.current = window.setTimeout(() => {
      setPin(null);
    }, 700);
  };

  const cancelClearTimer = () => {
    if (clearTimer.current) {
      window.clearTimeout(clearTimer.current);
      clearTimer.current = null;
    }
  };

  const readyToContinue = status === "ready" && !!pin;

  const onContinue = () => {
    if (!readyToContinue || !area) return;
    const canvas = canvasRef.current;
    const snapshot = canvas?.toDataURL("image/png");
    updateDraft({
      areaId: area.id,
      areaName: area.name,
      spotX: pin?.x,
      spotY: pin?.y,
      mapSnapshotDataUrl: snapshot,
    });
    navigate("/finalize");
  };

  if (status === "no-area") {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-4">
        <h1 className="k-title text-primary">Map Select</h1>
        <p className="text-slate-600">Area not found.</p>
        <Link to="/home" className="k-btn px-4 py-2 w-fit">
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="k-title text-primary">{status === "ready" ? area?.name : "Loading…"}</h1>
        <div className="text-sm flex gap-3">
          <Link to="/home" className="k-btn px-4 py-2">
            Back
          </Link>
          <Link to="/admin" className="k-btn px-4 py-2">
            Admin
          </Link>
        </div>
      </div>

      <div className="k-card">
        <canvas
          ref={canvasRef}
          onClick={onCanvasClick}
          onPointerDown={startClearTimer}
          onPointerUp={cancelClearTimer}
          onPointerLeave={cancelClearTimer}
          className="w-full bg-slate-200 rounded"
          style={{ cursor: "crosshair", minHeight: 320 }}
        />
        {!pin && (
          <p className="text-sm text-slate-600 mt-2">Tap to place a pin. Long press to clear it.</p>
        )}
        {pin && (
          <p className="text-sm text-slate-600 mt-2">
            Pin placed. Long press to remove.
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
