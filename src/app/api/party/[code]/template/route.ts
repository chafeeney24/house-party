// POST /api/party/[code]/template - Load a prediction template

import { NextRequest, NextResponse } from 'next/server';
import { getPartyByCode, addGame } from '@/lib/store';
import { getTemplate } from '@/lib/templates';

export async function POST(
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
    
    if (!body.template) {
      return NextResponse.json(
        { error: 'Template name is required' },
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
    
    // Check if requester is host
    if (party.hostId !== guestId) {
      return NextResponse.json(
        { error: 'Only the host can load templates' },
        { status: 403 }
      );
    }
    
    const template = getTemplate(body.template);
    
    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }
    
    // Add all predictions from template
    const addedGames = [];
    for (const prediction of template) {
      const game = await addGame(code, {
        type: prediction.type,
        question: prediction.question,
        options: prediction.options,
        overUnderValue: prediction.overUnderValue,
        points: prediction.points,
      });
      if (game) {
        addedGames.push(game);
      }
    }
    
    return NextResponse.json({
      success: true,
      added: addedGames.length,
    });
  } catch (error) {
    console.error('Error loading template:', error);
    return NextResponse.json(
      { error: 'Failed to load template' },
      { status: 500 }
    );
  }
}
