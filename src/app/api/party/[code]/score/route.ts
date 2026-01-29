// POST /api/party/[code]/score - Score a game (host only)

import { NextRequest, NextResponse } from 'next/server';
import { scoreGame, getPartyByCode, getGame, getLeaderboard } from '@/lib/store';
import { ScoreGameRequest } from '@/types';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const body: ScoreGameRequest = await request.json();
    const guestId = request.headers.get('x-guest-id');
    
    if (!guestId) {
      return NextResponse.json(
        { error: 'Guest ID is required' },
        { status: 401 }
      );
    }
    
    const party = getPartyByCode(code);
    
    if (!party) {
      return NextResponse.json(
        { error: 'Party not found' },
        { status: 404 }
      );
    }
    
    // Check if requester is host
    if (party.hostId !== guestId) {
      return NextResponse.json(
        { error: 'Only the host can score games' },
        { status: 403 }
      );
    }
    
    if (!body.gameId || body.correctAnswer === undefined) {
      return NextResponse.json(
        { error: 'Game ID and correct answer are required' },
        { status: 400 }
      );
    }
    
    const game = getGame(body.gameId);
    
    if (!game || game.partyId !== party.id) {
      return NextResponse.json(
        { error: 'Game not found in this party' },
        { status: 404 }
      );
    }
    
    const success = scoreGame(body.gameId, body.correctAnswer);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to score game' },
        { status: 500 }
      );
    }
    
    // Return updated leaderboard
    const leaderboard = getLeaderboard(code);
    
    return NextResponse.json({
      success: true,
      game: getGame(body.gameId),
      leaderboard,
    });
  } catch (error) {
    console.error('Error scoring game:', error);
    return NextResponse.json(
      { error: 'Failed to score game' },
      { status: 500 }
    );
  }
}
