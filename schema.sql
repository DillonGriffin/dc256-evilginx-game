CREATE TABLE IF NOT EXISTS used_lures (
  id TEXT PRIMARY KEY,
  lure_hash TEXT NOT NULL UNIQUE,
  lure_url TEXT NOT NULL,
  lure_host TEXT NOT NULL,
  service_id TEXT NOT NULL DEFAULT 'unknown',
  account_id TEXT NOT NULL,
  participant TEXT,
  status TEXT NOT NULL DEFAULT 'sent',
  created_at TEXT NOT NULL,
  opened_at TEXT,
  captured_at TEXT
);

CREATE TABLE IF NOT EXISTS solved_flags (
  flag_hash TEXT PRIMARY KEY,
  account_id TEXT NOT NULL UNIQUE,
  participant TEXT,
  points INTEGER NOT NULL,
  submitted_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS game_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL,
  account_id TEXT,
  participant TEXT,
  detail TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_used_lures_account ON used_lures(account_id);
CREATE INDEX IF NOT EXISTS idx_solved_flags_account ON solved_flags(account_id);
CREATE INDEX IF NOT EXISTS idx_game_events_created ON game_events(created_at);
