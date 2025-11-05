// src/db/dexie.ts
import Dexie from "dexie";
import { EntryRecord, Area } from "../lib/entryTypes";

export class HraDB extends Dexie {
  areas!: Dexie.Table<Area, string>;
  entries!: Dexie.Table<EntryRecord, string>;

  constructor() {
    super("hra_kiosk_db");

    // v1 (legacy)
    this.version(1).stores({
      areas: "id,name",
      entries: "id,timestamp,areaId,status",
    });

<<<<<<< HEAD
    // v2: add category index and upgrade existing rows
    this.version(2)
      .stores({
        areas: "id,name,category",
        entries: "id,timestamp,areaId,status",
      })
      .upgrade(async (tx) => {
        const tbl = tx.table("areas");
        await tbl.toCollection().modify((a: any) => {
          if (!a.category) a.category = "CTMT";
        });
=======
    this.version(2)
      .stores({
        areas: 'id,name,category',
        entries: 'id,timestamp,areaId,status',
      })
      .upgrade(async (tx) => {
        await tx
          .table<Area>('areas')
          .toCollection()
          .modify((area) => {
            if (!area.category) {
              area.category = 'CTMT';
            }
          });
>>>>>>> origin/codex/implement-ctmt-and-rhr-maps-flow-x31wew
      });
  }
}

export const db = new HraDB();
