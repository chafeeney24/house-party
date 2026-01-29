// POST /api/party/[code]/submit - Submit a prediction

import { NextRequest, NextResponse } from 'next/server';
import { submitPrediction, getPartyByCode, getGame } from '@/lib/store';
import { SubmitPredictionRequest } from '@/types';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const body: SubmitPredictionRequest = await request.json();
    const guestId = request.headers.get('x-guest-id');
    
    if (!guestId) {
      return NextResponse.json(
        { error: 'Guest ID is required' },
        { status: 401 }
      );
    }
    
    if (!body.gameId || body.answer === undefined) {
      return NextResponse.json(
        { error: 'Game ID and answer are required' },
        { status: 400 }
      );
    }
    
    const party = await getPartyByCode(code);
    
    if (!party) {
      return NextResponse.json(
        { error: 'Party not found' },
        { status: 404 }
      );
    }
    
    if (party.isLocked) {
      return NextResponse.json(
        { error: 'Predictions are locked' },
        { status: 403 }
      );
    }
    
    const game = await getGame(body.gameId);
    
    if (!game || game.partyId !== party.id) {
      return NextResponse.json(
        { error: 'Game not found in this party' },
        { status: 404 }
      );
    }
    
    if (game.isScored) {
      return NextResponse.json(
        { error: 'This game has already been scored' },
        { status: 403 }
      );
    }
    
    const prediction = await submitPrediction(guestId, body.gameId, body.answer);
    
    if (!prediction) {
      return NextResponse.json(
        { error: 'Failed to submit prediction' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ prediction });
  } catch (error) {
    console.error('Error submitting prediction:', error);
    return NextResponse.json(
      { error: 'Failed to submit prediction' },
      { status: 500 }
    );
  }
}
