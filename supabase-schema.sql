-- House Party Database Schema
-- Run this in Supabase SQL Editor (https://supabase.com/dashboard/project/iocqfkljlqmfbrpwutme/sql)

-- Parties table
CREATE TABLE parties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(10) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  host_id UUID NOT NULL,
  is_locked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Guests table
CREATE TABLE guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id UUID REFERENCES parties(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  is_host BOOLEAN DEFAULT FALSE,
  joined_at TIMESTAMPTZ DEFAULT NOW()
);

-- Games (predictions) table
CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id UUID REFERENCES parties(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('pick-one', 'over-under', 'exact-number')),
  question TEXT NOT NULL,
  options JSONB,
  over_under_value DECIMAL,
  correct_answer VARCHAR(255),
  points INTEGER DEFAULT 1,
  is_scored BOOLEAN DEFAULT FALSE,
  order_num INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Predictions (answers) table
CREATE TABLE predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id UUID REFERENCES guests(id) ON DELETE CASCADE,
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  party_id UUID REFERENCES parties(id) ON DELETE CASCADE,
  answer VARCHAR(255) NOT NULL,
  points_awarded INTEGER,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(guest_id, game_id)
);

-- Indexes for performance
CREATE INDEX idx_parties_code ON parties(code);
CREATE INDEX idx_guests_party_id ON guests(party_id);
CREATE INDEX idx_games_party_id ON games(party_id);
CREATE INDEX idx_predictions_party_id ON predictions(party_id);
CREATE INDEX idx_predictions_guest_id ON predictions(guest_id);
CREATE INDEX idx_predictions_game_id ON predictions(game_id);

-- Enable Row Level Security (but allow all for now - can tighten later)
ALTER TABLE parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;

-- Policies to allow all operations (public app, no auth required)
CREATE POLICY "Allow all on parties" ON parties FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on guests" ON guests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on games" ON games FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on predictions" ON predictions FOR ALL USING (true) WITH CHECK (true);

-- Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE parties;
ALTER PUBLICATION supabase_realtime ADD TABLE guests;
ALTER PUBLICATION supabase_realtime ADD TABLE games;
ALTER PUBLICATION supabase_realtime ADD TABLE predictions;
