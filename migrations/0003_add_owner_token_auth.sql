-- Migration: Add owner token for authentication
-- Run with: wrangler d1 migrations apply amei-beauty-db --config wrangler.workers.toml

-- Add owner_token_hash field to cards table
ALTER TABLE cards ADD COLUMN owner_token_hash TEXT;

-- Create index for faster lookups (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_owner_token_hash ON cards(owner_token_hash);

-- Note: Existing cards will have NULL owner_token_hash
-- They will be treated as "legacy" cards (see migration strategy in docs)

