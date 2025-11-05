import Dexie, { Table } from 'dexie';
import { Area, EntryRecord } from '../lib/entryTypes';

export class HraDB extends Dexie {
  areas!: Table<Area, string>;
  entries!: Table<EntryRecord, string>;

  constructor() {
    super('hra_kiosk_db');
    this.version(1).stores({
      areas: 'id,name',
      entries: 'id,timestamp,areaId,status',
    });

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
      });
  }
}

export const db = new HraDB();