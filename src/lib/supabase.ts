import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface DbParty {
  id: string;
  code: string;
  name: string;
  host_id: string;
  is_locked: boolean;
  created_at: string;
}

export interface DbGuest {
  id: string;
  party_id: string;
  name: string;
  is_host: boolean;
  wants_squares: boolean;
  joined_at: string;
}

export interface DbGame {
  id: string;
  party_id: string;
  type: 'pick-one' | 'over-under' | 'exact-number';
  question: string;
  options: string[] | null;
  over_under_value: number | null;
  correct_answer: string | null;
  points: number;
  is_scored: boolean;
  order_num: number;
  created_at: string;
}

export interface DbPrediction {
  id: string;
  guest_id: string;
  game_id: string;
  party_id: string;
  answer: string;
  points_awarded: number | null;
  submitted_at: string;
}

export interface DbSquaresGrid {
  id: string;
  party_id: string;
  team_home: string;
  team_away: string;
  numbers_drawn: boolean;
  home_numbers: number[] | null;
  away_numbers: number[] | null;
  q1_score_home: number | null;
  q1_score_away: number | null;
  q2_score_home: number | null;
  q2_score_away: number | null;
  q3_score_home: number | null;
  q3_score_away: number | null;
  final_score_home: number | null;
  final_score_away: number | null;
  created_at: string;
}

export interface DbSquaresClaim {
  id: string;
  grid_id: string;
  guest_id: string;
  row_index: number;
  col_index: number;
  claimed_at: string;
}
