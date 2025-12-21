-- Rate limiting table for tracking API usage per IP
CREATE TABLE IF NOT EXISTS rate_limits (
  id TEXT PRIMARY KEY,
  action TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  window_start INTEGER NOT NULL
);

-- Index for efficient lookups by id and action
CREATE INDEX IF NOT EXISTS rate_limits_action_idx ON rate_limits(id, action);
