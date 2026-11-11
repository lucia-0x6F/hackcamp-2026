import type Database from 'better-sqlite3';
import type { ActivityFilters, ActivityRecord, ActivityRepository } from './ActivityRepository.js';

export class SqliteActivityRepository implements ActivityRepository {
  constructor(private readonly database: Database.Database) {}

  async create(a: ActivityRecord) {
    this.database
      .prepare(
        `INSERT INTO activities (id,creator_id,school_id,name,description,type,location,start_time,end_time,link)
         VALUES (@id,@creatorId,@schoolId,@name,@description,@type,@location,@startTime,@endTime,@link)`,
      )
      .run(a);

    return a;
  }

  async findById(id: string) {
    const row = this.database
      .prepare(
        `SELECT id,creator_id AS creatorId,school_id AS schoolId,name,description,type,location,
                start_time AS startTime,end_time AS endTime,link
         FROM activities
         WHERE id=? AND deleted_at IS NULL`,
      )
      .get(id) as ActivityRecord | undefined;

    return row ?? null;
  }

  async list(f: ActivityFilters) {
    const conditions = [
      'school_id=@schoolId',
      'deleted_at IS NULL',
      "end_time > datetime('now')",
    ];
    if (f.type) conditions.push('type=@type');
    if (f.location) conditions.push('location LIKE @location');
    if (f.startTime) conditions.push('start_time >= @startTime');
    if (f.endTime) conditions.push('start_time < @endTime');

    return this.database
      .prepare(
        `SELECT id,creator_id AS creatorId,school_id AS schoolId,name,description,type,location,
                start_time AS startTime,end_time AS endTime,link
         FROM activities
         WHERE ${conditions.join(' AND ')}
         ORDER BY start_time`,
      )
      .all({
        ...f,
        location: f.location ? `%${f.location}%` : undefined,
      }) as ActivityRecord[];
  }

  async cleanupExpired() {
    this.database
      .prepare("UPDATE activities SET deleted_at=datetime('now') WHERE deleted_at IS NULL AND end_time <= datetime('now')")
      .run();
  }

  async update(id: string, a: Partial<Omit<ActivityRecord, 'id' | 'creatorId'>>) {
    const entries = Object.entries(a).filter(([, v]) => v !== undefined);
    if (!entries.length) {
      return this.findById(id);
    }

    const sets = entries
      .map(([k]) => `${k.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`)}=@${k}`)
      .join(',');

    this.database
      .prepare(`UPDATE activities SET ${sets} WHERE id=@id AND deleted_at IS NULL`)
      .run({ ...a, id });

    return this.findById(id);
  }

  async delete(id: string, creatorId: string) {
    const result = this.database
      .prepare(
        `UPDATE activities
         SET deleted_at=datetime('now')
         WHERE id=? AND creator_id=? AND deleted_at IS NULL`,
      )
      .run(id, creatorId);

    return result.changes > 0;
  }
}
