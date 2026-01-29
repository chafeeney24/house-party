// POST /api/party/[code]/games - Add a game to a party

import { NextRequest, NextResponse } from 'next/server';
import { addGame, getPartyByCode } from '@/lib/store';
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
