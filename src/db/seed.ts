// src/db/seed.ts
import { db } from "./dexie";
import areas from "../data/mock_areas.json";

export async function seedMock() {
  await db.transaction("rw", db.areas, async () => {
    await db.areas.clear();
    const seeded = (areas as any[]).map((a) => ({
      ...a,
      category: a.category || "CTMT",
    }));
    await db.areas.bulkAdd(seeded);
  });
}