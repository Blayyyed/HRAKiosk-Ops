import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../db/dexie';
import { Area, EntryRecord } from '../lib/entryTypes';
import areasJson from '../data/mock_areas.json';

type AreaSeed = { ctmt: Area[]; rhr: Area[] };

const FALLBACK_RHR: Area[] = ((areasJson as unknown as AreaSeed).rhr || []).map((area) => ({
  ...area,
  mapPath: area.mapPath || '/maps/placeholder.svg',
  category: area.category ?? 'RHR',
}));

const RHRScroll: React.FC = () => {
  const nav = useNavigate();
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const rows = await db.areas.where('category').equals('RHR').toArray();
        if (!active) {
          return;
        }
        if (rows.length > 0) {
          rows.sort((a, b) => a.name.localeCompare(b.name));
          setAreas(rows);
        } else {
          const fallback = [...FALLBACK_RHR];
          fallback.sort((a, b) => a.name.localeCompare(b.name));
          setAreas(fallback);
        }
      } catch (err) {
        console.error('Failed to load RHR maps', err);
        if (!active) {
          return;
        }
        setError('Unable to load RHR maps. Please try again.');
        const fallback = [...FALLBACK_RHR];
        fallback.sort((a, b) => a.name.localeCompare(b.name));
        setAreas(fallback);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, []);

  const onComplete = async () => {
    setSubmitError(null);
    setSaving(true);
    try {
      const record: EntryRecord = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        areaId: 'RHR_REVIEW',
        areaName: 'RHR/RCIC Maps Reviewed',
        spX: 0.5,
        spY: 0.5,
        badges: [],
        status: 'entry_pending',
      };

      await db.entries.add(record);
      nav('/thanks');
    } catch (err) {
      console.error('Failed to record RHR review', err);
      setSubmitError('Unable to submit review confirmation. Please retry.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col gap-6 min-h-screen">
        <header>
          <h1 className="text-3xl font-bold text-slate-900">RHR / RCIC Maps</h1>
          <p className="text-slate-600 mt-1">
            Scroll through the maps below for RHR / RCIC access planning.
          </p>
        </header>

        {error && (
          <div className="bg-rose-100 border border-rose-200 text-rose-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="text-center text-slate-600 py-10">Loading RHR maps…</div>
          ) : areas.length === 0 ? (
            <div className="text-center text-slate-600 py-10 space-y-2">
              <p>No RHR / RCIC maps available.</p>
              <p className="text-sm text-slate-500">
                Upload maps from the Admin panel, or commit RHR entries to{' '}
                <code className="px-1">src/data/mock_areas.json</code>{' '}
                so they deploy with every Vercel build.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {areas.map((area) => (
                <div key={area.id} className="bg-white border rounded-lg shadow-sm overflow-hidden">
                  <div className="bg-slate-50 px-4 py-2 border-b">
                    <h2 className="text-lg font-semibold text-slate-800">{area.name}</h2>
                  </div>
                  <div className="p-4">
                    <img
                      src={area.mapPath || '/maps/placeholder.svg'}
                      alt={area.name}
                      className="w-full rounded-md border object-contain max-h-80"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {submitError && (
          <div className="bg-rose-100 border border-rose-200 text-rose-700 px-4 py-3 rounded">
            {submitError}
          </div>
        )}

        <div className="bg-white border rounded-lg shadow-sm p-6 flex flex-col gap-4">
          <p className="text-lg font-semibold text-slate-800">
            Finished reviewing the RHR / RCIC maps?
          </p>
          <button
            onClick={onComplete}
            disabled={saving}
            className={`px-5 py-2 rounded text-white font-medium ${
              saving ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {saving ? 'Submitting…' : 'Complete Review'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RHRScroll;
