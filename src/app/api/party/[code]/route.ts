// GET /api/party/[code] - Get party details

import { NextRequest, NextResponse } from 'next/server';
import { getPartyByCode, lockParty, unlockParty } from '@/lib/store';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const party = getPartyByCode(code);
  
  if (!party) {
    return NextResponse.json(
      { error: 'Party not found' },
      { status: 404 }
    );
  }
  
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
    lockParty(code);
  } else if (body.isLocked === false) {
    unlockParty(code);
  }
  
  const party = getPartyByCode(code);
  
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
