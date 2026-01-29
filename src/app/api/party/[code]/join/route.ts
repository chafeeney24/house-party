// POST /api/party/[code]/join - Join a party

import { NextRequest, NextResponse } from 'next/server';
import { joinParty, getPartyByCode } from '@/lib/store';
import { JoinPartyRequest } from '@/types';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const body: JoinPartyRequest = await request.json();
    
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
    
    const guest = await joinParty(code, body.guestName);
    
    if (!guest) {
      return NextResponse.json(
        { error: 'Failed to join party' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      guest: {
        id: guest.id,
        name: guest.name,
      },
      party: {
        code: party.code,
        name: party.name,
      },
    });
  } catch (error) {
    console.error('Error joining party:', error);
    return NextResponse.json(
      { error: 'Failed to join party' },
      { status: 500 }
    );
  }
}
