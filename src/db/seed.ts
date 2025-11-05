// src/db/seed.ts
import { db } from "./dexie";
import areas from "../data/mock_areas.json";

export async function seedMock() {
  await db.transaction("rw", db.areas, async () => {
    await db.areas.clear();
    const seeded = (areas as AreaSeed[]).map((area) => ({
      ...area,
      category: area.category ?? "CTMT",
    }));
    await db.areas.bulkAdd(seeded);
  });
}

type AreaSeed = {
  id: string;
  name: string;
  mapPath: string;
  category?: "CTMT" | "RHR";
  elevation?: string;
  doseRate_mrem_hr?: number;
  contamination_cpm?: number;
  hfc?: string;
  notes?: string;
};
