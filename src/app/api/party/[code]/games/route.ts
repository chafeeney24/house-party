// POST /api/party/[code]/games - Add a game to a party
// PUT /api/party/[code]/games - Reorder games

import { NextRequest, NextResponse } from 'next/server';
import { addGame, getPartyByCode, reorderGames } from '@/lib/store';
import { AddGameRequest } from '@/types';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const body: AddGameRequest = await request.json();
    
    if (!body.type || !body.question) {
      return NextResponse.json(
        { error: 'Game type and question are required' },
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
    
    const game = await addGame(code, {
      type: body.type,
      question: body.question,
      options: body.options,
      overUnderValue: body.overUnderValue,
      points: body.points || 1,
    });
    
    if (!game) {
      return NextResponse.json(
        { error: 'Failed to add game' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ game });
  } catch (error) {
    console.error('Error adding game:', error);
    return NextResponse.json(
      { error: 'Failed to add game' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const body = await request.json();
    const guestId = request.headers.get('x-guest-id');

    if (!guestId) {
      return NextResponse.json(
        { error: 'Guest ID is required' },
        { status: 401 }
      );
    }

    const party = await getPartyByCode(code);

    if (!party) {
      return NextResponse.json(
        { error: 'Party not found' },
        { status: 404 }
      );
    }

    // Check if requester is host
    if (party.hostId !== guestId) {
      return NextResponse.json(
        { error: 'Only the host can reorder games' },
        { status: 403 }
      );
    }

    const { gameIds } = body;
    if (!Array.isArray(gameIds) || gameIds.length === 0) {
      return NextResponse.json(
        { error: 'gameIds array is required' },
        { status: 400 }
      );
    }

    const success = await reorderGames(party.id, gameIds);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to reorder games' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error reordering games:', error);
    return NextResponse.json(
      { error: 'Failed to reorder games' },
      { status: 500 }
    );
  }
}
