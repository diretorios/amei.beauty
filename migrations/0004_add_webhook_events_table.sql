-- Migration: Add webhook events table for idempotency
-- Run with: wrangler d1 migrations apply amei-beauty-db --config wrangler.workers.toml

-- Table to track processed Stripe webhook events for idempotency
CREATE TABLE IF NOT EXISTS webhook_events (
  event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  processed_at INTEGER NOT NULL,
  card_id TEXT,
  status TEXT NOT NULL DEFAULT 'processed',
  error_message TEXT,
  FOREIGN KEY (card_id) REFERENCES cards(id)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_webhook_events_type ON webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_events_card_id ON webhook_events(card_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed_at ON webhook_events(processed_at DESC);

