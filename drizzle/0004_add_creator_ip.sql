-- Add creator IP column to games table for history filtering
ALTER TABLE games ADD COLUMN creator_ip TEXT;

-- Index for efficient lookups by creator IP
CREATE INDEX IF NOT EXISTS games_creator_ip_idx ON games(creator_ip);
