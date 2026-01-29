// GET /api/party/[code]/leaderboard - Get party leaderboard

import { NextRequest, NextResponse } from 'next/server';
import { getLeaderboard, getPartyByCode } from '@/lib/store';

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
  
  const leaderboard = getLeaderboard(code);
  
  return NextResponse.json({ leaderboard });
}
