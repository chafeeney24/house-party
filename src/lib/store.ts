// Supabase-backed store for House Party

import { supabase, DbParty, DbGuest, DbGame, DbPrediction } from './supabase';
import { Party, Game, Guest, Prediction, GameType } from '@/types';

// Helper to generate short codes
export function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Transform database rows to app types
function dbPartyToParty(dbParty: DbParty, games: Game[] = [], guests: Guest[] = []): Party {
  return {
    id: dbParty.id,
    code: dbParty.code,
    name: dbParty.name,
    hostId: dbParty.host_id,
    createdAt: new Date(dbParty.created_at),
    isLocked: dbParty.is_locked,
    games,
    guests,
  };
}

function dbGuestToGuest(dbGuest: DbGuest): Guest {
  return {
    id: dbGuest.id,
    partyId: dbGuest.party_id,
    name: dbGuest.name,
    isHost: dbGuest.is_host,
    joinedAt: new Date(dbGuest.joined_at),
  };
}

function dbGameToGame(dbGame: DbGame): Game {
  return {
    id: dbGame.id,
    partyId: dbGame.party_id,
    type: dbGame.type as GameType,
    question: dbGame.question,
    options: dbGame.options as string[] | undefined,
    overUnderValue: dbGame.over_under_value ?? undefined,
    correctAnswer: dbGame.correct_answer ?? undefined,
    points: dbGame.points,
    isScored: dbGame.is_scored,
    order: dbGame.order_num,
  };
}

// Party operations
export async function createParty(name: string, hostName: string): Promise<{ party: Party; host: Guest } | null> {
  let code = generateCode();
  
  // Check for unique code
  let attempts = 0;
  while (attempts < 10) {
    const { data: existing } = await supabase
      .from('parties')
      .select('code')
      .eq('code', code)
      .single();
    
    if (!existing) break;
    code = generateCode();
    attempts++;
  }

  // Create party first (without host_id, we'll update it)
  const { data: partyData, error: partyError } = await supabase
    .from('parties')
    .insert({
      code,
      name,
      host_id: '00000000-0000-0000-0000-000000000000', // Temporary, will update
      is_locked: false,
    })
    .select()
    .single();

  if (partyError || !partyData) {
    console.error('Error creating party:', partyError);
    return null;
  }

  // Create host guest
  const { data: hostData, error: hostError } = await supabase
    .from('guests')
    .insert({
      party_id: partyData.id,
      name: hostName,
      is_host: true,
    })
    .select()
    .single();

  if (hostError || !hostData) {
    console.error('Error creating host:', hostError);
    return null;
  }

  // Update party with host_id
  await supabase
    .from('parties')
    .update({ host_id: hostData.id })
    .eq('id', partyData.id);

  const host = dbGuestToGuest(hostData);
  const party = dbPartyToParty({ ...partyData, host_id: hostData.id }, [], [host]);

  return { party, host };
}

export async function getPartyByCode(code: string): Promise<Party | null> {
  const { data: partyData, error: partyError } = await supabase
    .from('parties')
    .select('*')
    .eq('code', code.toUpperCase())
    .single();

  if (partyError || !partyData) {
    return null;
  }

  // Get guests
  const { data: guestsData } = await supabase
    .from('guests')
    .select('*')
    .eq('party_id', partyData.id)
    .order('joined_at', { ascending: true });

  // Get games
  const { data: gamesData } = await supabase
    .from('games')
    .select('*')
    .eq('party_id', partyData.id)
    .order('order_num', { ascending: true });

  const guests = (guestsData || []).map(dbGuestToGuest);
  const games = (gamesData || []).map(dbGameToGame);

  return dbPartyToParty(partyData, games, guests);
}

export async function lockParty(code: string): Promise<boolean> {
  const { error } = await supabase
    .from('parties')
    .update({ is_locked: true })
    .eq('code', code.toUpperCase());

  return !error;
}

export async function unlockParty(code: string): Promise<boolean> {
  const { error } = await supabase
    .from('parties')
    .update({ is_locked: false })
    .eq('code', code.toUpperCase());

  return !error;
}

// Guest operations
export async function joinParty(code: string, guestName: string): Promise<Guest | null> {
  const party = await getPartyByCode(code);
  if (!party) return null;

  const { data: guestData, error } = await supabase
    .from('guests')
    .insert({
      party_id: party.id,
      name: guestName,
      is_host: false,
    })
    .select()
    .single();

  if (error || !guestData) {
    console.error('Error joining party:', error);
    return null;
  }

  return dbGuestToGuest(guestData);
}

export async function removeGuest(guestId: string, partyCode: string): Promise<boolean> {
  const party = await getPartyByCode(partyCode);
  if (!party) return false;

  // Don't allow removing the host
  const guest = party.guests.find(g => g.id === guestId);
  if (!guest || guest.isHost) return false;

  // Delete predictions by this guest for this party
  await supabase
    .from('predictions')
    .delete()
    .eq('guest_id', guestId)
    .eq('party_id', party.id);

  // Delete squares claims by this guest
  const { data: grid } = await supabase
    .from('squares_grids')
    .select('id')
    .eq('party_id', party.id)
    .single();

  if (grid) {
    await supabase
      .from('squares_claims')
      .delete()
      .eq('grid_id', grid.id)
      .eq('guest_id', guestId);
  }

  // Delete the guest
  const { error } = await supabase
    .from('guests')
    .delete()
    .eq('id', guestId);

  if (error) {
    console.error('Error removing guest:', error);
    return false;
  }

  return true;
}

export async function getGuest(guestId: string): Promise<Guest | null> {
  const { data, error } = await supabase
    .from('guests')
    .select('*')
    .eq('id', guestId)
    .single();

  if (error || !data) return null;
  return dbGuestToGuest(data);
}

// Game operations
export async function addGame(
  code: string,
  game: { type: GameType; question: string; options?: string[]; overUnderValue?: number; points: number }
): Promise<Game | null> {
  const party = await getPartyByCode(code);
  if (!party) return null;

  // Get current game count for order
  const { count } = await supabase
    .from('games')
    .select('*', { count: 'exact', head: true })
    .eq('party_id', party.id);

  const { data: gameData, error } = await supabase
    .from('games')
    .insert({
      party_id: party.id,
      type: game.type,
      question: game.question,
      options: game.options || null,
      over_under_value: game.overUnderValue || null,
      points: game.points,
      is_scored: false,
      order_num: count || 0,
    })
    .select()
    .single();

  if (error || !gameData) {
    console.error('Error adding game:', error);
    return null;
  }

  return dbGameToGame(gameData);
}

export async function reorderGames(partyId: string, gameIds: string[]): Promise<boolean> {
  // Update order_num for each game based on its position in the array
  for (let i = 0; i < gameIds.length; i++) {
    const { error } = await supabase
      .from('games')
      .update({ order_num: i })
      .eq('id', gameIds[i])
      .eq('party_id', partyId);

    if (error) {
      console.error('Error reordering game:', error);
      return false;
    }
  }

  return true;
}

export async function getGame(gameId: string): Promise<Game | null> {
  const { data, error } = await supabase
    .from('games')
    .select('*')
    .eq('id', gameId)
    .single();

  if (error || !data) return null;
  return dbGameToGame(data);
}

export async function updateGame(
  gameId: string,
  updates: { question?: string; options?: string[]; overUnderValue?: number; points?: number }
): Promise<Game | null> {
  const updateData: Record<string, unknown> = {};
  
  if (updates.question !== undefined) updateData.question = updates.question;
  if (updates.options !== undefined) updateData.options = updates.options;
  if (updates.overUnderValue !== undefined) updateData.over_under_value = updates.overUnderValue;
  if (updates.points !== undefined) updateData.points = updates.points;

  const { data, error } = await supabase
    .from('games')
    .update(updateData)
    .eq('id', gameId)
    .select()
    .single();

  if (error || !data) {
    console.error('Error updating game:', error);
    return null;
  }

  return dbGameToGame(data);
}

export async function deleteGame(gameId: string): Promise<boolean> {
  // Delete associated predictions first (cascade should handle this, but being explicit)
  await supabase
    .from('predictions')
    .delete()
    .eq('game_id', gameId);

  const { error } = await supabase
    .from('games')
    .delete()
    .eq('id', gameId);

  if (error) {
    console.error('Error deleting game:', error);
    return false;
  }

  return true;
}

export async function scoreGame(gameId: string, correctAnswer: string | number): Promise<boolean> {
  const game = await getGame(gameId);
  if (!game) return false;

  // Update game with correct answer
  const { error: gameError } = await supabase
    .from('games')
    .update({
      correct_answer: String(correctAnswer),
      is_scored: true,
    })
    .eq('id', gameId);

  if (gameError) {
    console.error('Error scoring game:', gameError);
    return false;
  }

  // Get all predictions for this game
  const { data: predictions } = await supabase
    .from('predictions')
    .select('*')
    .eq('game_id', gameId);

  if (!predictions) return true;

  // Calculate points for each prediction
  if (game.type === 'exact-number') {
    // For exact-number: closest guess(es) win full points
    const correctNum = Number(correctAnswer);
    const guesses = predictions.map(p => ({
      id: p.id,
      guess: Number(p.answer),
      distance: Math.abs(Number(p.answer) - correctNum),
    }));
    
    // Find the minimum distance (closest guess)
    const minDistance = Math.min(...guesses.map(g => g.distance));
    
    // Award points to all who had the closest guess
    for (const guess of guesses) {
      const pointsAwarded = guess.distance === minDistance ? game.points : 0;
      await supabase
        .from('predictions')
        .update({ points_awarded: pointsAwarded })
        .eq('id', guess.id);
    }
  } else {
    // For pick-one and over-under: case-insensitive match
    for (const prediction of predictions) {
      const pointsAwarded = prediction.answer.toLowerCase() === String(correctAnswer).toLowerCase()
        ? game.points
        : 0;

      await supabase
        .from('predictions')
        .update({ points_awarded: pointsAwarded })
        .eq('id', prediction.id);
    }
  }

  return true;
}

// Prediction operations
export async function submitPrediction(
  guestId: string,
  gameId: string,
  answer: string | number
): Promise<Prediction | null> {
  const guest = await getGuest(guestId);
  const game = await getGame(gameId);

  if (!guest || !game) return null;

  // Upsert prediction (update if exists, insert if not)
  const { data, error } = await supabase
    .from('predictions')
    .upsert(
      {
        guest_id: guestId,
        game_id: gameId,
        party_id: guest.partyId,
        answer: String(answer),
        submitted_at: new Date().toISOString(),
      },
      {
        onConflict: 'guest_id,game_id',
      }
    )
    .select()
    .single();

  if (error || !data) {
    console.error('Error submitting prediction:', error);
    return null;
  }

  return {
    id: data.id,
    guestId: data.guest_id,
    gameId: data.game_id,
    partyId: data.party_id,
    answer: data.answer,
    submittedAt: new Date(data.submitted_at),
    pointsAwarded: data.points_awarded ?? undefined,
  };
}

export async function getPredictionsForGuest(guestId: string): Promise<Prediction[]> {
  const { data } = await supabase
    .from('predictions')
    .select('*')
    .eq('guest_id', guestId);

  return (data || []).map((p: DbPrediction) => ({
    id: p.id,
    guestId: p.guest_id,
    gameId: p.game_id,
    partyId: p.party_id,
    answer: p.answer,
    submittedAt: new Date(p.submitted_at),
    pointsAwarded: p.points_awarded ?? undefined,
  }));
}

// Get correct predictions for a game (who got it right)
export async function getCorrectPredictionsForGame(gameId: string): Promise<{ guestId: string; guestName: string }[]> {
  const { data: predictions } = await supabase
    .from('predictions')
    .select(`
      guest_id,
      points_awarded,
      guests!inner(id, name)
    `)
    .eq('game_id', gameId)
    .gt('points_awarded', 0);

  if (!predictions) return [];

  return predictions.map((p) => ({
    guestId: p.guest_id,
    guestName: (p.guests as unknown as { name: string }).name,
  }));
}

// Get all correct predictions for a party (grouped by game)
export async function getCorrectPredictionsForParty(code: string): Promise<Record<string, { guestId: string; guestName: string }[]>> {
  const party = await getPartyByCode(code);
  if (!party) return {};

  const result: Record<string, { guestId: string; guestName: string }[]> = {};

  // Only get correct predictions for scored games
  const scoredGames = party.games.filter(g => g.isScored);
  
  for (const game of scoredGames) {
    result[game.id] = await getCorrectPredictionsForGame(game.id);
  }

  return result;
}

// Leaderboard
export async function getLeaderboard(code: string): Promise<{ guestId: string; guestName: string; totalPoints: number; gamesPlayed: number }[]> {
  const party = await getPartyByCode(code);
  if (!party) return [];

  const leaderboard = await Promise.all(
    party.guests.map(async (guest) => {
      const { data: predictions } = await supabase
        .from('predictions')
        .select('points_awarded')
        .eq('guest_id', guest.id)
        .not('points_awarded', 'is', null);

      const totalPoints = (predictions || []).reduce(
        (sum, p) => sum + (p.points_awarded || 0),
        0
      );

      return {
        guestId: guest.id,
        guestName: guest.name,
        totalPoints,
        gamesPlayed: (predictions || []).length,
      };
    })
  );

  return leaderboard.sort((a, b) => b.totalPoints - a.totalPoints);
}
