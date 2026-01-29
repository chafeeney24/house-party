// Core types for House Party

export type GameType = 'pick-one' | 'over-under' | 'exact-number';

export interface Party {
  id: string;
  code: string;
  name: string;
  hostId: string;
  createdAt: Date;
  isLocked: boolean;
  games: Game[];
  guests: Guest[];
}

export interface Game {
  id: string;
  partyId: string;
  type: GameType;
  question: string;
  options?: string[]; // For pick-one games
  overUnderValue?: number; // For over-under games
  correctAnswer?: string | number;
  points: number;
  isScored: boolean;
  order: number;
}

export interface Guest {
  id: string;
  partyId: string;
  name: string;
  isHost: boolean;
  joinedAt: Date;
}

export interface Prediction {
  id: string;
  guestId: string;
  gameId: string;
  partyId: string;
  answer: string | number;
  submittedAt: Date;
  pointsAwarded?: number;
}

export interface LeaderboardEntry {
  guestId: string;
  guestName: string;
  totalPoints: number;
  gamesPlayed: number;
}

// API request/response types
export interface CreatePartyRequest {
  name: string;
  hostName: string;
}

export interface JoinPartyRequest {
  guestName: string;
}

export interface AddGameRequest {
  type: GameType;
  question: string;
  options?: string[];
  overUnderValue?: number;
  points?: number;
}

export interface SubmitPredictionRequest {
  gameId: string;
  answer: string | number;
}

export interface ScoreGameRequest {
  gameId: string;
  correctAnswer: string | number;
}
