// GET /api/party/[code]/predictions - Get predictions for a guest

import { NextRequest, NextResponse } from 'next/server';
import { getPartyByCode, getPredictionsForGuest } from '@/lib/store';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
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
  
  const predictions = await getPredictionsForGuest(guestId);
  
  // Convert to a map of gameId -> answer for easy lookup
  const predictionMap: Record<string, string | number> = {};
  for (const p of predictions) {
    predictionMap[p.gameId] = p.answer;
  }
  
  return NextResponse.json({ predictions: predictionMap });
}
