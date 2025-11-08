// src/db/seed.ts
import { db } from "./dexie";
import areas from "../data/mock_areas.json";
=======
import { db } from './dexie';
>>>>>>> origin/codex/implement-ctmt-and-rhr-maps-flow-x31wew

export async function seedMock(): Promise<void> {
  const seedData = areas as unknown as AreaSeedGroup;
  const ctmt = (seedData.ctmt || []).map<Area>((area) => ({
    ...area,
    category: "CTMT",
    mapPath: area.mapPath || "/maps/placeholder.svg",
  }));
  const rhr = (seedData.rhr || []).map<Area>((area) => ({
    ...area,
    category: "RHR",
    mapPath: area.mapPath || "/maps/placeholder.svg",
  }));

  await db.transaction("rw", db.areas, async () => {
    await db.areas.clear();
<<<<<<< HEAD
    const seeded = (areas as any[]).map((a) => ({
      ...a,
      category: a.category || "CTMT",
    }));
    await db.areas.bulkAdd(seeded);
=======
>>>>>>> origin/codex/implement-ctmt-and-rhr-maps-flow-x31wew
  });
}
