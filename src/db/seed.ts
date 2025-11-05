import { db } from './dexie';

export async function seedMock() {
  await db.transaction('rw', db.areas, db.entries, async () => {
    await db.entries.clear();
    await db.areas.clear();
  });
}
