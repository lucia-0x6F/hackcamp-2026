import type Database from 'better-sqlite3';
import { User } from '../domain/User.js';
import type { Profile } from '../types.js';
import type { UserRepository } from './UserRepository.js';

type UserRow = {
  id: string;
  email: string;
  school_id: number;
  name: string;
  school_year: Profile['schoolYear'];
  major: string | null;
  hobbies: string;
  interested_types: string;
};

export class SqliteUserRepository implements UserRepository {
  constructor(private readonly database: Database.Database) {}

  async exists(id: string): Promise<boolean> {
    return Boolean(this.database.prepare('SELECT 1 FROM users WHERE id = ?').get(id));
  }

  async find(id: string): Promise<User | null> {
    const row = this.database
      .prepare('SELECT * FROM users WHERE id = ?')
      .get(id) as UserRow | undefined;

    if (!row) return null;

    return User.create(
      row.id,
      {
        schoolId: row.school_id,
        name: row.name,
        schoolYear: row.school_year,
        major: row.major,
        hobbies: JSON.parse(row.hobbies),
        interestedTypes: JSON.parse(row.interested_types),
      },
      row.email,
    );
  }

  async save(user: User): Promise<void> {
    this.database
      .prepare(
        `INSERT INTO users (id, email, name, school_id, school_year, major, hobbies, interested_types)
         VALUES (@id, @email, @name, @schoolId, @schoolYear, @major, @hobbies, @interestedTypes)
         ON CONFLICT(id) DO UPDATE SET
           email=@email,
           name=@name,
           school_id=@schoolId,
           school_year=@schoolYear,
           major=@major,
           hobbies=@hobbies,
           interested_types=@interestedTypes`,
      )
      .run({
        id: user.id,
        email: user.email,
        name: user.name,
        schoolId: user.schoolId,
        schoolYear: user.schoolYear,
        major: user.major,
        hobbies: JSON.stringify(user.hobbies),
        interestedTypes: JSON.stringify(user.interestedTypes),
      });
  }
}