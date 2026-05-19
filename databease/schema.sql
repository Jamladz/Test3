-- Cloudflare D1 Database Schema for Tap-to-Earn Game

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY, -- Telegram User ID
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  balance INTEGER DEFAULT 0,
  energy INTEGER DEFAULT 1000,
  max_energy INTEGER DEFAULT 1000,
  tap_multiplier INTEGER DEFAULT 1,
  profit_per_hour INTEGER DEFAULT 0,
  last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  referer_id INTEGER NULL,
  CONSTRAINT fk_referer FOREIGN KEY (referer_id) REFERENCES users(id)
);

-- User Upgrades
CREATE TABLE IF NOT EXISTS user_upgrades (
  user_id INTEGER,
  upgrade_id TEXT,
  level INTEGER DEFAULT 1,
  PRIMARY KEY (user_id, upgrade_id),
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Upgrades Data (Could also be hardcoded in Worker/KV)
CREATE TABLE IF NOT EXISTS upgrades (
  id TEXT PRIMARY KEY,
  name TEXT,
  description TEXT,
  base_cost INTEGER,
  base_profit INTEGER,
  cost_multiplier REAL,
  profit_multiplier REAL,
  category TEXT
);

-- Referrals tracking
CREATE TABLE IF NOT EXISTS referrals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  referer_id INTEGER NOT NULL,
  referee_id INTEGER NOT NULL UNIQUE,
  status TEXT DEFAULT 'pending', -- pending, rewarded
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Missions / Tasks
CREATE TABLE IF NOT EXISTS missions (
  id TEXT PRIMARY KEY,
  type TEXT, -- social, daily, special
  reward INTEGER,
  requirements TEXT -- JSON
);

-- User Missions
CREATE TABLE IF NOT EXISTS user_missions (
  user_id INTEGER,
  mission_id TEXT,
  completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, mission_id)
);
