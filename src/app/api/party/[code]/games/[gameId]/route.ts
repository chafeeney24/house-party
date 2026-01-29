// PATCH/DELETE /api/party/[code]/games/[gameId] - Edit or delete a game

import { NextRequest, NextResponse } from 'next/server';
import { getPartyByCode, getGame, updateGame, deleteGame } from '@/lib/store';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ code: string; gameId: string }> }
) {
  try {
    const { code, gameId } = await params;
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
        { error: 'Only the host can edit games' },
        { status: 403 }
      );
    }
    
    const game = await getGame(gameId);
    
    if (!game || game.partyId !== party.id) {
      return NextResponse.json(
        { error: 'Game not found in this party' },
        { status: 404 }
      );
    }
    
    const updatedGame = await updateGame(gameId, {
      question: body.question,
      options: body.options,
      overUnderValue: body.overUnderValue,
      points: body.points,
    });
    
    if (!updatedGame) {
      return NextResponse.json(
        { error: 'Failed to update game' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ game: updatedGame });
  } catch (error) {
    console.error('Error updating game:', error);
    return NextResponse.json(
      { error: 'Failed to update game' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ code: string; gameId: string }> }
) {
  try {
    const { code, gameId } = await params;
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
        { error: 'Only the host can delete games' },
        { status: 403 }
      );
    }
    
    const game = await getGame(gameId);
    
    if (!game || game.partyId !== party.id) {
      return NextResponse.json(
        { error: 'Game not found in this party' },
        { status: 404 }
      );
    }
    
    const success = await deleteGame(gameId);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete game' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting game:', error);
    return NextResponse.json(
      { error: 'Failed to delete game' },
      { status: 500 }
    );
  }
}
