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
