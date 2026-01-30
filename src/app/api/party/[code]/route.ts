// GET /api/party/[code] - Get party details

import { NextRequest, NextResponse } from 'next/server';
import { getPartyByCode, lockParty, unlockParty, getCorrectPredictionsForParty } from '@/lib/store';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const party = await getPartyByCode(code);
  
  if (!party) {
    return NextResponse.json(
      { error: 'Party not found' },
      { status: 404 }
    );
  }
  
  // Get who answered correctly for each scored game
  const correctPredictions = await getCorrectPredictionsForParty(code);
  
  return NextResponse.json({
    code: party.code,
    name: party.name,
    isLocked: party.isLocked,
    games: party.games,
    guests: party.guests.map(g => ({
      id: g.id,
      name: g.name,
      isHost: g.isHost,
    })),
    correctPredictions,
  });
}

// PATCH /api/party/[code] - Lock/unlock party
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const body = await request.json();
  
  if (body.isLocked === true) {
    await lockParty(code);
  } else if (body.isLocked === false) {
    await unlockParty(code);
  }
  
  const party = await getPartyByCode(code);
  
  if (!party) {
    return NextResponse.json(
      { error: 'Party not found' },
      { status: 404 }
    );
  }
  
  return NextResponse.json({
    code: party.code,
    isLocked: party.isLocked,
  });
}
