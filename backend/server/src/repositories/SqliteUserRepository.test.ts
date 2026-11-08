import Database from 'better-sqlite3';
import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it } from 'vitest';
import { User } from '../domain/User.js';
import { SqliteUserRepository } from './SqliteUserRepository.js';

// Runs against a throwaway in-memory database, never oncampus.db.
let repo: SqliteUserRepository;

beforeEach(() => {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  db.exec(readFileSync(new URL('../schema.sql', import.meta.url), 'utf8'));
  repo = new SqliteUserRepository(db);
});

const maya = () =>
  User.create(
    'auth0|maya',
    { schoolId: 1, name: 'Maya', schoolYear: 'second', major: 'Commerce', hobbies: ['hiking'], interestedTypes: ['study'] },
    'maya@student.ubc.ca',
  );

describe('SqliteUserRepository', () => {
  it('saves a new profile and reads it back', async () => {
    await repo.save(maya());

    const found = await repo.find('auth0|maya');
    expect(found).toMatchObject({
      id: 'auth0|maya',
      email: 'maya@student.ubc.ca',
      name: 'Maya',
      schoolId: 1,
      schoolYear: 'second',
      major: 'Commerce',
      hobbies: ['hiking'],
      interestedTypes: ['study'],
    });
  });

  it('updates an existing profile instead of creating a second one', async () => {
    await repo.save(maya());
    await repo.save(
      User.create(
        'auth0|maya',
        { schoolId: 1, name: 'Maya L', schoolYear: 'third', major: null, hobbies: [], interestedTypes: ['food'] },
        'maya@student.ubc.ca',
      ),
    );

    const found = await repo.find('auth0|maya');
    expect(found).toMatchObject({ name: 'Maya L', schoolYear: 'third', major: null, interestedTypes: ['food'] });
  });

  it('returns null for an unknown user', async () => {
    expect(await repo.find('auth0|nobody')).toBeNull();
  });
});
