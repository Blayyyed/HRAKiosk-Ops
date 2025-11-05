import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../db/dexie';
import { seedMock } from '../db/seed';

/**
 * Landing page that points operators to the CTMT maps flow.
 */
const Home: React.FC = () => {
  const nav = useNavigate();

  useEffect(() => {
    (async () => {
      const count = await db.areas.count();
      if (count === 0) {
        await seedMock();
      }
    })();
  }, []);

  return (
    <div className="max-w-screen-sm mx-auto p-6 space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-slate-900">Operator Rounds</h1>
        <p className="text-sm text-slate-600">
          Start with the CTMT map gallery to review your planned access path.
        </p>
      </header>

      <button
        className="w-full rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold px-4 py-3 shadow"
        onClick={() => nav('/ctmt')}
      >
        CTMT Maps
      </button>
    </div>
  );
};

export default Home;