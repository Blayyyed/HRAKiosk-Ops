import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../db/dexie';
import { Area, EntryRecord } from '../lib/entryTypes';
import areasJson from '../data/mock_areas.json';

const FALLBACK_AREAS: Area[] = (areasJson as Area[]).map((area) => ({
  ...area,
  mapPath: area.mapPath || '/maps/placeholder.svg',
  category: area.category ?? 'CTMT',
}));

const CTMTScroll: React.FC = () => {
  const nav = useNavigate();
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsRhr, setNeedsRhr] = useState<'yes' | 'no' | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const rows = await db.areas.where('category').equals('CTMT').toArray();
        if (!active) {
          return;
        }
        if (rows.length > 0) {
          rows.sort((a, b) => a.name.localeCompare(b.name));
          setAreas(rows);
        } else {
          const fallback = FALLBACK_AREAS.filter((a) => (a.category ?? 'CTMT') === 'CTMT');
          fallback.sort((a, b) => a.name.localeCompare(b.name));
          setAreas(fallback);
        }
      } catch (err) {
        console.error('Failed to load CTMT maps', err);
        if (!active) {
          return;
        }
        setError('Unable to load CTMT maps. Please try again.');
        const fallback = FALLBACK_AREAS.filter((a) => (a.category ?? 'CTMT') === 'CTMT');
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

  const areaCards = useMemo(() => {
    if (areas.length === 0) {
      return (
        <div className="text-center text-slate-600 py-10 space-y-2">
          <p>No CTMT maps available.</p>
          <p className="text-sm text-slate-500">
            Use the Admin panel to upload maps, or commit CTMT entries to{' '}
            <code className="px-1">src/data/mock_areas.json</code>{' '}
            so they ship with each Vercel build.
          </p>
        </div>
      );
    }

    return (
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
    );
  }, [areas]);

  const onContinue = async () => {
    if (!needsRhr) {
      return;
    }

    setError(null);

    if (needsRhr === 'yes') {
      nav('/rhr');
      return;
    }

    setSaving(true);
    try {
      const record: EntryRecord = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        areaId: 'CTMT_ROUND',
        areaName: 'CTMT Group (RHR/RCIC: No)',
        spotX: 0.5,
        spotY: 0.5,
        badges: [],
        workOrder: '',
        status: 'entry_pending',
      };

      await db.entries.add(record);
      nav('/thanks');
    } catch (err) {
      console.error('Failed to create entry record', err);
      setError('Unable to create entry. Please retry.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col gap-6 min-h-screen">
        <header>
          <h1 className="text-3xl font-bold text-slate-900">CTMT Maps</h1>
          <p className="text-slate-600 mt-1">
            Scroll through the available CTMT maps below to review the layout before continuing.
          </p>
        </header>

        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="text-center text-slate-600 py-10">Loading CTMT maps…</div>
          ) : (
            areaCards
          )}
        </div>

        {error && (
          <div className="bg-rose-100 border border-rose-200 text-rose-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="bg-white border rounded-lg shadow-sm p-6 space-y-4">
          <p className="text-lg font-semibold text-slate-800">RHR/RCIC access needed?</p>
          <div className="flex flex-wrap gap-6 text-slate-700">
            <label className="inline-flex items-center gap-2">
              <input
                type="radio"
                name="needsRhr"
                value="no"
                checked={needsRhr === 'no'}
                onChange={() => setNeedsRhr('no')}
              />
              <span>No</span>
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="radio"
                name="needsRhr"
                value="yes"
                checked={needsRhr === 'yes'}
                onChange={() => setNeedsRhr('yes')}
              />
              <span>Yes</span>
            </label>
          </div>

          <div className="flex justify-end">
            <button
              className={`px-5 py-2 rounded text-white font-medium ${
                needsRhr ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-400'
              } ${saving ? 'opacity-70 cursor-wait' : ''}`}
              onClick={onContinue}
              disabled={!needsRhr || saving}
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CTMTScroll;
