import Database from 'better-sqlite3';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const sourceDir = dirname(fileURLToPath(import.meta.url));
// Keep the development database anchored to backend/server regardless of the
// directory from which the server is started.
const databasePath = process.env.DB_PATH || resolve(sourceDir, '../oncampus.db');

if (process.env.NODE_ENV !== 'test') {
  console.info(`[database] ${databasePath}`);
}

export const db = new Database(databasePath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.exec(readFileSync(new URL('./schema.sql', import.meta.url), 'utf8'));
