-- Migration: Add endorsement and payment tracking fields
-- Run with: wrangler d1 migrations apply amei-beauty-db

-- Add new fields for 30-day free period and endorsement/payment tracking
ALTER TABLE cards ADD COLUMN free_period_end INTEGER;
ALTER TABLE cards ADD COLUMN updates_enabled_until INTEGER;
ALTER TABLE cards ADD COLUMN endorsement_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE cards ADD COLUMN last_endorsement_at INTEGER;
ALTER TABLE cards ADD COLUMN can_update INTEGER NOT NULL DEFAULT 1;
ALTER TABLE cards ADD COLUMN payment_status TEXT NOT NULL DEFAULT 'none';
ALTER TABLE cards ADD COLUMN payment_date INTEGER;
ALTER TABLE cards ADD COLUMN payment_amount REAL;
ALTER TABLE cards ADD COLUMN payment_currency TEXT;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_updates_enabled_until ON cards(updates_enabled_until);
CREATE INDEX IF NOT EXISTS idx_endorsement_count ON cards(endorsement_count);
CREATE INDEX IF NOT EXISTS idx_payment_status ON cards(payment_status);

-- Set default values for existing cards (grandfather them with 30 days from now)
-- This gives existing cards 30 days free period starting from migration
UPDATE cards 
SET 
  free_period_end = (published_at + (30 * 24 * 60 * 60 * 1000)),
  updates_enabled_until = (published_at + (30 * 24 * 60 * 60 * 1000)),
  can_update = 1,
  endorsement_count = 0,
  payment_status = 'none'
WHERE free_period_end IS NULL;

