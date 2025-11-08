// src/db/seed.ts
import { db } from "./dexie";
import type { Area, AreaCategory } from "../lib/entryTypes";
import areas from "../data/mock_areas.json";

type AreaSeed = Omit<Area, "category" | "mapPath"> & {
  mapPath?: string;
  category?: AreaCategory;
};

type AreaSeedGroup = {
  ctmt?: AreaSeed[];
  rhr?: AreaSeed[];
};

const PLACEHOLDER_SRC = "/maps/placeholder.svg";

const normalizeSeed = (seed: AreaSeed, category: AreaCategory): Area => ({
  id: seed.id,
  name: seed.name,
  mapPath: seed.mapPath && seed.mapPath.length > 0 ? seed.mapPath : PLACEHOLDER_SRC,
  category,
  elevation: seed.elevation,
  doseRate_mrem_hr: seed.doseRate_mrem_hr,
  contamination_cpm: seed.contamination_cpm,
  hfc: seed.hfc,
  notes: seed.notes,
});

export async function seedMock(): Promise<void> {
  const payload = areas as AreaSeedGroup | AreaSeed[];

  const ctmtSeeds: Area[] = [];
  const rhrSeeds: Area[] = [];

  if (Array.isArray(payload)) {
    payload.forEach((seed) => {
      const category = seed.category ?? "CTMT";
      const target = category === "RHR" ? rhrSeeds : ctmtSeeds;
      target.push(normalizeSeed(seed, category));
    });
  } else {
    payload.ctmt?.forEach((seed) => {
      ctmtSeeds.push(normalizeSeed(seed, "CTMT"));
    });
    payload.rhr?.forEach((seed) => {
      rhrSeeds.push(normalizeSeed(seed, "RHR"));
    });
  }

  await db.transaction("rw", db.areas, async () => {
    await db.areas.clear();
    const combined = [...ctmtSeeds, ...rhrSeeds];
    if (combined.length > 0) {
      await db.areas.bulkAdd(combined);
    }
  });
}
