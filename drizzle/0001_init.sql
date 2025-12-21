-- Create games table
CREATE TABLE IF NOT EXISTS games (
  id TEXT PRIMARY KEY,
  initial_prompt TEXT NOT NULL,
  model_chain TEXT NOT NULL, -- JSON array of model IDs
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  current_step INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER DEFAULT (unixepoch()),
  completed_at INTEGER
);

-- Create game_steps table
CREATE TABLE IF NOT EXISTS game_steps (
  id TEXT PRIMARY KEY,
  game_id TEXT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  model_id TEXT NOT NULL,
  model_type TEXT NOT NULL CHECK (model_type IN ('text-to-image', 'vision')),
  input TEXT NOT NULL,
  output TEXT,
  prediction_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'succeeded', 'failed')),
  error TEXT,
  created_at INTEGER DEFAULT (unixepoch()),
  completed_at INTEGER
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_game_steps_game_id ON game_steps(game_id);
CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);
CREATE INDEX IF NOT EXISTS idx_games_created_at ON games(created_at);
