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

    this.version(4)
      .stores({
        areas: "id,name,category",
        entries: "id,timestamp,areaId,status",
      })
      .upgrade(async (tx) => {
        await tx
          .table<EntryRecord>("entries")
          .toCollection()
          .modify((entry) => {
            if (!entry.status) {
              entry.status = "entry_pending";
            }
            const legacy = entry as EntryRecord & { workOrder?: string };
            if (!legacy.workRequest && legacy.workOrder) {
              legacy.workRequest = legacy.workOrder;
              delete legacy.workOrder;
            }
          });
      });

    this.version(5)
      .stores({
        areas: "id,name,category",
        entries: "id,timestamp,areaId,status",
      })
      .upgrade(async (tx) => {
        await tx
          .table<EntryRecord>("entries")
          .toCollection()
          .modify((entry) => {
            if (!Array.isArray(entry.badges)) {
              const masked = Array.isArray(entry.badgesMasked)
                ? entry.badgesMasked
                : [];
              entry.badges = masked.map((value) => value.replace(/\*/g, "")).filter(Boolean);
            }
            if (!Array.isArray(entry.badgesMasked) && Array.isArray(entry.badges)) {
              entry.badgesMasked = entry.badges.map((badge) =>
                badge.length > 4 ? `${"*".repeat(Math.max(0, badge.length - 4))}${badge.slice(-4)}` : badge
              );
            }
            if ((entry as { leadBadge?: string }).leadBadge) {
              delete (entry as { leadBadge?: string }).leadBadge;
            }
          });
      });
  }
}

export const db = new HraDB();
