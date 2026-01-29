// In-memory store for MVP
// TODO: Replace with Supabase/Planetscale for persistence

import { Party, Game, Guest, Prediction } from '@/types';

// In-memory storage
const parties: Map<string, Party> = new Map();
const games: Map<string, Game> = new Map();
const guests: Map<string, Guest> = new Map();
const predictions: Map<string, Prediction> = new Map();

// Helper to generate short codes
export function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function generateId(): string {
  return crypto.randomUUID();
}

// Party operations
export function createParty(name: string, hostName: string): { party: Party; host: Guest } {
  const partyId = generateId();
  const hostId = generateId();
  let code = generateCode();
  
  // Ensure unique code
  while (parties.has(code)) {
    code = generateCode();
  }
  
  const host: Guest = {
    id: hostId,
    partyId,
    name: hostName,
    isHost: true,
    joinedAt: new Date(),
  };
  
  const party: Party = {
    id: partyId,
    code,
    name,
    hostId,
    createdAt: new Date(),
    isLocked: false,
    games: [],
    guests: [host],
  };
  
  parties.set(code, party);
  guests.set(hostId, host);
  
  return { party, host };
}

export function getPartyByCode(code: string): Party | undefined {
  return parties.get(code.toUpperCase());
}

export function lockParty(code: string): boolean {
  const party = parties.get(code.toUpperCase());
  if (party) {
    party.isLocked = true;
    return true;
  }
  return false;
}

export function unlockParty(code: string): boolean {
  const party = parties.get(code.toUpperCase());
  if (party) {
    party.isLocked = false;
    return true;
  }
  return false;
}

// Guest operations
export function joinParty(code: string, guestName: string): Guest | null {
  const party = parties.get(code.toUpperCase());
  if (!party) return null;
  
  const guest: Guest = {
    id: generateId(),
    partyId: party.id,
    name: guestName,
    isHost: false,
    joinedAt: new Date(),
  };
  
  party.guests.push(guest);
  guests.set(guest.id, guest);
  
  return guest;
}

export function getGuest(guestId: string): Guest | undefined {
  return guests.get(guestId);
}

// Game operations
export function addGame(code: string, game: Omit<Game, 'id' | 'partyId' | 'isScored' | 'order'>): Game | null {
  const party = parties.get(code.toUpperCase());
  if (!party) return null;
  
  const newGame: Game = {
    ...game,
    id: generateId(),
    partyId: party.id,
    isScored: false,
    order: party.games.length,
  };
  
  party.games.push(newGame);
  games.set(newGame.id, newGame);
  
  return newGame;
}

export function getGame(gameId: string): Game | undefined {
  return games.get(gameId);
}

export function scoreGame(gameId: string, correctAnswer: string | number): boolean {
  const game = games.get(gameId);
  if (!game) return false;
  
  game.correctAnswer = correctAnswer;
  game.isScored = true;
  
  // Calculate points for all predictions for this game
  const gamePredictions = Array.from(predictions.values()).filter(p => p.gameId === gameId);
  
  for (const prediction of gamePredictions) {
    if (game.type === 'exact-number') {
      // For exact number, closest wins (we'll handle ties later)
      // For now, exact match = full points, otherwise 0
      prediction.pointsAwarded = prediction.answer === correctAnswer ? game.points : 0;
    } else {
      // For pick-one and over-under, exact match required
      prediction.pointsAwarded = String(prediction.answer).toLowerCase() === String(correctAnswer).toLowerCase() 
        ? game.points 
        : 0;
    }
  }
  
  return true;
}

// Prediction operations
export function submitPrediction(guestId: string, gameId: string, answer: string | number): Prediction | null {
  const guest = guests.get(guestId);
  const game = games.get(gameId);
  
  if (!guest || !game) return null;
  
  // Check if already submitted
  const existing = Array.from(predictions.values()).find(
    p => p.guestId === guestId && p.gameId === gameId
  );
  
  if (existing) {
    // Update existing prediction
    existing.answer = answer;
    existing.submittedAt = new Date();
    return existing;
  }
  
  const prediction: Prediction = {
    id: generateId(),
    guestId,
    gameId,
    partyId: guest.partyId,
    answer,
    submittedAt: new Date(),
  };
  
  predictions.set(prediction.id, prediction);
  
  return prediction;
}

export function getPredictionsForGuest(guestId: string): Prediction[] {
  return Array.from(predictions.values()).filter(p => p.guestId === guestId);
}

export function getPredictionsForGame(gameId: string): Prediction[] {
  return Array.from(predictions.values()).filter(p => p.gameId === gameId);
}

// Leaderboard
export function getLeaderboard(code: string): { guestId: string; guestName: string; totalPoints: number; gamesPlayed: number }[] {
  const party = parties.get(code.toUpperCase());
  if (!party) return [];
  
  const leaderboard = party.guests.map(guest => {
    const guestPredictions = Array.from(predictions.values()).filter(
      p => p.guestId === guest.id && p.pointsAwarded !== undefined
    );
    
    return {
      guestId: guest.id,
      guestName: guest.name,
      totalPoints: guestPredictions.reduce((sum, p) => sum + (p.pointsAwarded || 0), 0),
      gamesPlayed: guestPredictions.length,
    };
  });
  
  return leaderboard.sort((a, b) => b.totalPoints - a.totalPoints);
}
