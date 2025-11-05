import { db } from './dexie';

const CTMT_DEFAULTS = [
  {
    id: 'CT_DEFAULT_1',
    name: 'CTMT Elevation 100',
    mapPath: '/maps/placeholder.svg',
    category: 'CTMT' as const,
  },
  {
    id: 'CT_DEFAULT_2',
    name: 'CTMT Elevation 120',
    mapPath: '/maps/placeholder.svg',
    category: 'CTMT' as const,
  },
];

const RHR_DEFAULTS = [
  {
    id: 'RHR_DEFAULT_1',
    name: 'RHR Pump A',
    mapPath: '/maps/placeholder.svg',
    category: 'RHR' as const,
  },
  {
    id: 'RHR_DEFAULT_2',
    name: 'RHR Pump B',
    mapPath: '/maps/placeholder.svg',
    category: 'RHR' as const,
  },
];

export async function seedMock() {
  await db.transaction('rw', db.areas, db.entries, async () => {
    await db.entries.clear();
    await db.areas.clear();
    await db.areas.bulkAdd([
      ...CTMT_DEFAULTS,
      ...RHR_DEFAULTS,
    ]);
  });
}