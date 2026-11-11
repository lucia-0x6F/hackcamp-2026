CREATE TABLE IF NOT EXISTS schools (
  id           INTEGER PRIMARY KEY,
  name         TEXT NOT NULL UNIQUE,
  email_domain TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS users (
  id               TEXT PRIMARY KEY,
  email            TEXT NOT NULL UNIQUE,
  name             TEXT NOT NULL,
  pronoun          TEXT,
  school_id        INTEGER NOT NULL REFERENCES schools(id),
  school_year      TEXT NOT NULL
    CHECK (school_year IN ('first','second','third','fourth','fourth+','graduate')),
  major            TEXT,
  hobbies          TEXT NOT NULL DEFAULT '[]',
  interested_types TEXT NOT NULL DEFAULT '[]',
  created_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS activities (
  id            TEXT PRIMARY KEY,
  creator_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  school_id     INTEGER NOT NULL REFERENCES schools(id),
  name          TEXT NOT NULL,
  description   TEXT NOT NULL DEFAULT '',
  type          TEXT NOT NULL
    CHECK (type IN ('study','food','sports','career','other')),
  location      TEXT NOT NULL,
  start_time    TEXT NOT NULL,
  end_time      TEXT NOT NULL,
  link          TEXT,
  deleted_at    TEXT,
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  CHECK (end_time > start_time)
);
CREATE INDEX IF NOT EXISTS idx_act_school_start ON activities(school_id, start_time);

CREATE TABLE IF NOT EXISTS join_requests (
  id          TEXT PRIMARY KEY,
  activity_id TEXT NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status      TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','accepted','rejected')),
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE (activity_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_req_user ON join_requests(user_id);

INSERT OR IGNORE INTO schools (name, email_domain) VALUES
  ('University of British Columbia', 'student.ubc.ca'),
  ('Simon Fraser University', 'sfu.ca'),
  ('University of Victoria', 'uvic.ca');
