-- Super Bowl Squares Migration
-- Run this in your Supabase SQL Editor

-- Squares grid table (one per party)
CREATE TABLE IF NOT EXISTS squares_grids (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  party_id UUID REFERENCES parties(id) ON DELETE CASCADE,
  team_home TEXT NOT NULL DEFAULT 'Home',
  team_away TEXT NOT NULL DEFAULT 'Away',
  numbers_drawn BOOLEAN DEFAULT FALSE,
  home_numbers INTEGER[] DEFAULT NULL,  -- 0-9 shuffled for columns
  away_numbers INTEGER[] DEFAULT NULL,  -- 0-9 shuffled for rows
  q1_score_home INTEGER DEFAULT NULL,
  q1_score_away INTEGER DEFAULT NULL,
  q2_score_home INTEGER DEFAULT NULL,
  q2_score_away INTEGER DEFAULT NULL,
  q3_score_home INTEGER DEFAULT NULL,
  q3_score_away INTEGER DEFAULT NULL,
  final_score_home INTEGER DEFAULT NULL,
  final_score_away INTEGER DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(party_id)
);

-- Individual square claims
CREATE TABLE IF NOT EXISTS squares_claims (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  grid_id UUID REFERENCES squares_grids(id) ON DELETE CASCADE,
  guest_id UUID REFERENCES guests(id) ON DELETE CASCADE,
  row_index INTEGER NOT NULL CHECK (row_index >= 0 AND row_index <= 9),
  col_index INTEGER NOT NULL CHECK (col_index >= 0 AND col_index <= 9),
  claimed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(grid_id, row_index, col_index)
);

-- Enable RLS
ALTER TABLE squares_grids ENABLE ROW LEVEL SECURITY;
ALTER TABLE squares_claims ENABLE ROW LEVEL SECURITY;

-- RLS Policies for squares_grids
CREATE POLICY "Anyone can view squares grids" ON squares_grids
  FOR SELECT USING (true);

CREATE POLICY "Anyone can create squares grids" ON squares_grids
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update squares grids" ON squares_grids
  FOR UPDATE USING (true);

-- RLS Policies for squares_claims
CREATE POLICY "Anyone can view squares claims" ON squares_claims
  FOR SELECT USING (true);

CREATE POLICY "Anyone can create squares claims" ON squares_claims
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can delete squares claims" ON squares_claims
  FOR DELETE USING (true);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_squares_claims_grid ON squares_claims(grid_id);
CREATE INDEX IF NOT EXISTS idx_squares_grids_party ON squares_grids(party_id);
