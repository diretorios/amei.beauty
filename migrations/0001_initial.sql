-- Initial schema for amei.beauty D1 database
-- Run with: wrangler d1 migrations apply amei-beauty-db

-- Published cards table
CREATE TABLE IF NOT EXISTS cards (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE,
  profile_json TEXT NOT NULL,
  services_json TEXT NOT NULL DEFAULT '[]',
  social_json TEXT NOT NULL DEFAULT '[]',
  links_json TEXT NOT NULL DEFAULT '[]',
  ratings_json TEXT NOT NULL DEFAULT '[]',
  testimonials_json TEXT NOT NULL DEFAULT '[]',
  client_photos_json TEXT NOT NULL DEFAULT '[]',
  badges_json TEXT NOT NULL DEFAULT '[]',
  certifications_json TEXT NOT NULL DEFAULT '[]',
  recommendations_json TEXT NOT NULL DEFAULT '{"count":0,"recent":[]}',
  location_json TEXT,
  referral_code TEXT NOT NULL UNIQUE,
  published_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  is_featured INTEGER NOT NULL DEFAULT 0,
  subscription_tier TEXT NOT NULL DEFAULT 'free'
);

-- Indexes for search and discovery
CREATE INDEX IF NOT EXISTS idx_username ON cards(username);
CREATE INDEX IF NOT EXISTS idx_published_at ON cards(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_is_active ON cards(is_active);
CREATE INDEX IF NOT EXISTS idx_is_featured ON cards(is_featured);
CREATE INDEX IF NOT EXISTS idx_subscription_tier ON cards(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_referral_code ON cards(referral_code);

-- Full-text search index (for SQLite FTS5)
CREATE VIRTUAL TABLE IF NOT EXISTS cards_fts USING fts5(
  id UNINDEXED,
  profile_json,
  services_json,
  content='cards',
  content_rowid='rowid'
);

-- Triggers to keep FTS index in sync
CREATE TRIGGER IF NOT EXISTS cards_fts_insert AFTER INSERT ON cards BEGIN
  INSERT INTO cards_fts(rowid, profile_json, services_json)
  VALUES (new.rowid, new.profile_json, new.services_json);
END;

CREATE TRIGGER IF NOT EXISTS cards_fts_delete AFTER DELETE ON cards BEGIN
  INSERT INTO cards_fts(cards_fts, rowid, profile_json, services_json)
  VALUES('delete', old.rowid, old.profile_json, old.services_json);
END;

CREATE TRIGGER IF NOT EXISTS cards_fts_update AFTER UPDATE ON cards BEGIN
  INSERT INTO cards_fts(cards_fts, rowid, profile_json, services_json)
  VALUES('delete', old.rowid, old.profile_json, old.services_json);
  INSERT INTO cards_fts(rowid, profile_json, services_json)
  VALUES (new.rowid, new.profile_json, new.services_json);
END;

