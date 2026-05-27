-- ============================================================
-- Life OS — Supabase Schema
-- Run this in your Supabase SQL Editor to create all tables
-- ============================================================

-- USERS
CREATE TABLE IF NOT EXISTS users (
  id              BIGSERIAL PRIMARY KEY,
  name            TEXT NOT NULL DEFAULT 'User',
  xp              INTEGER NOT NULL DEFAULT 0,
  streak          INTEGER NOT NULL DEFAULT 0,
  time_availability TEXT NOT NULL DEFAULT '10min',
  last_active_date  DATE,
  preferences     JSONB,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- DOMAINS
CREATE TABLE IF NOT EXISTS domains (
  id          BIGSERIAL PRIMARY KEY,
  user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  icon        TEXT DEFAULT '📌',
  stage       TEXT NOT NULL DEFAULT 'foundation'  CHECK (stage IN ('foundation', 'skill', 'mastery')),
  priority    TEXT NOT NULL DEFAULT 'medium'      CHECK (priority IN ('high', 'medium', 'low')),
  last_done   DATE,
  streak      INTEGER NOT NULL DEFAULT 0,
  is_custom   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- PATHWAYS
CREATE TABLE IF NOT EXISTS pathways (
  id               BIGSERIAL PRIMARY KEY,
  user_id          BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  domain           TEXT,
  total_sessions   INTEGER NOT NULL DEFAULT 21,
  current_session  INTEGER NOT NULL DEFAULT 0,
  active           BOOLEAN NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- TASKS
CREATE TABLE IF NOT EXISTS tasks (
  id          BIGSERIAL PRIMARY KEY,
  user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  domain      TEXT,
  pathway_id  BIGINT REFERENCES pathways(id) ON DELETE SET NULL,
  title       TEXT NOT NULL,
  why         TEXT,
  how         JSONB,
  xp          INTEGER NOT NULL DEFAULT 10,
  completed   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SEED DATA — Default user + domains (update as needed)
-- ============================================================

INSERT INTO users (id, name, xp, streak, time_availability, last_active_date)
VALUES (1, 'Haifa', 120, 5, '10min', CURRENT_DATE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO domains (user_id, name, icon, stage, priority, is_custom)
VALUES
  (1, 'Fitness',        '💪', 'foundation', 'high',   false),
  (1, 'Social',         '🤝', 'skill',      'medium',  false),
  (1, 'Learning',       '📚', 'foundation', 'high',   false),
  (1, 'Mindfulness',    '🧘', 'foundation', 'medium',  false),
  (1, 'Creativity',     '🎨', 'skill',      'low',    false)
ON CONFLICT DO NOTHING;
