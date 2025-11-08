// src/db/seed.ts
import { db } from "./dexie";
import areas from "../data/mock_areas.json";
import type { Area } from "../lib/entryTypes";

export async function seedMock(): Promise<void> {
  await db.transaction("rw", db.areas, async () => {
    await db.areas.clear();
    const seedData = areas as unknown as { ctmt: Area[]; rhr: Area[] };
    const seeded = [...seedData.ctmt, ...seedData.rhr].map((area) => ({
      ...area,
      category: area.category || "CTMT",
      mapPath: area.mapPath || "/maps/placeholder.svg",
    }));
    await db.areas.bulkAdd(seeded);
  });
}
