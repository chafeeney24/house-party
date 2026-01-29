// POST /api/party/[code]/rejoin - Rejoin a party by name

import { NextRequest, NextResponse } from 'next/server';
import { getPartyByCode } from '@/lib/store';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const body = await request.json();
    
    if (!body.guestName) {
      return NextResponse.json(
        { error: 'Guest name is required' },
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
    
    // Find guest by name (case-insensitive)
    const guest = party.guests.find(
      g => g.name.toLowerCase() === body.guestName.toLowerCase()
    );
    
    if (!guest) {
      return NextResponse.json(
        { error: 'No guest found with that name. Try joining as a new guest.' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      guest: {
        id: guest.id,
        name: guest.name,
        isHost: guest.isHost,
      },
      party: {
        code: party.code,
        name: party.name,
      },
    });
  } catch (error) {
    console.error('Error rejoining party:', error);
    return NextResponse.json(
      { error: 'Failed to rejoin party' },
      { status: 500 }
    );
  }
}
