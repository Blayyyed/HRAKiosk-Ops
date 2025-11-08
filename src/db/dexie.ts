// src/db/dexie.ts
import Dexie from "dexie";
import type { Area, EntryRecord } from "../lib/entryTypes";

export class HraDB extends Dexie {
  areas!: Dexie.Table<Area, string>;
  entries!: Dexie.Table<EntryRecord, string>;

  constructor() {
    super("hra_kiosk_db");

    this.version(1).stores({
      areas: "id,name",
      entries: "id,timestamp,areaId,status",
    });

    this.version(2)
      .stores({
        areas: "id,name,category",
        entries: "id,timestamp,areaId,status",
      })
      .upgrade(async (tx) => {
        await tx
          .table<Area>("areas")
          .toCollection()
          .modify((area) => {
            if (!area.category) {
              area.category = "CTMT";
            }
          });
      });

    this.version(3)
      .stores({
        areas: "id,name,category",
        entries: "id,timestamp,areaId,status",
      })
      .upgrade(async (tx) => {
        await tx
          .table<Area>("areas")
          .toCollection()
          .modify((area) => {
            if (!area.category) {
              area.category = "CTMT";
            }
          });

        await tx
          .table<EntryRecord>("entries")
          .toCollection()
          .modify((entry) => {
            if (!entry.status) {
              entry.status = "entry_pending";
            }
          });
      });
  }
}

export const db = new HraDB();
