import Dexie, { type Table } from 'dexie';

export interface OfflineReport {
  id?: number;
  species_id: string | null;
  description: string;
  image_url: string; // Base64 ou URL locale temporaire
  location: string; // Format WKT POINT(lng lat)
  type: 'observation' | 'alert';
  alert_level: string;
  created_at: string;
}

export class MyDatabase extends Dexie {
  reports!: Table<OfflineReport>;

  constructor() {
    super('EcoAtlasOffline');
    this.version(1).stores({
      reports: '++id, species_id, type, created_at'
    });
  }
}

export const db = new MyDatabase();
