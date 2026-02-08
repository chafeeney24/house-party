// GET /api/party/[code] - Get party details

import { NextRequest, NextResponse } from 'next/server';
import { getPartyByCode, lockParty, unlockParty, getCorrectPredictionsForParty } from '@/lib/store';
import { supabase } from '@/lib/supabase';

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

    // Auto-assign squares when locking
    try {
      const { data: partyData } = await supabase
        .from('parties')
        .select('id')
        .eq('code', code.toUpperCase())
        .single();

      if (partyData) {
        // Check if grid exists, create if not
        let { data: grid } = await supabase
          .from('squares_grids')
          .select('id, numbers_drawn')
          .eq('party_id', partyData.id)
          .single();

        if (!grid) {
          const { data: newGrid } = await supabase
            .from('squares_grids')
            .insert({
              party_id: partyData.id,
              team_home: 'Patriots',
              team_away: 'Seahawks',
            })
            .select()
            .single();
          grid = newGrid;
        }

        if (grid && !grid.numbers_drawn) {
          // Get all guests
          const { data: guests } = await supabase
            .from('guests')
            .select('id')
            .eq('party_id', partyData.id);

          if (guests && guests.length > 0) {
            // Clear any existing claims
            await supabase.from('squares_claims').delete().eq('grid_id', grid.id);

            // Shuffle positions and guest order
            const positions: [number, number][] = [];
            for (let r = 0; r < 10; r++) {
              for (let c = 0; c < 10; c++) {
                positions.push([r, c]);
              }
            }
            // Fisher-Yates shuffle
            for (let i = positions.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [positions[i], positions[j]] = [positions[j], positions[i]];
            }
            const guestIds = guests.map(g => g.id);
            for (let i = guestIds.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [guestIds[i], guestIds[j]] = [guestIds[j], guestIds[i]];
            }

            // Round-robin assign
            const claims = positions.map(([row, col], idx) => ({
              grid_id: grid!.id,
              guest_id: guestIds[idx % guestIds.length],
              row_index: row,
              col_index: col,
            }));

            await supabase.from('squares_claims').insert(claims);

            // Draw numbers
            const nums = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
            const homeNums = [...nums];
            const awayNums = [...nums];
            for (let i = 9; i > 0; i--) {
              let j = Math.floor(Math.random() * (i + 1));
              [homeNums[i], homeNums[j]] = [homeNums[j], homeNums[i]];
              j = Math.floor(Math.random() * (i + 1));
              [awayNums[i], awayNums[j]] = [awayNums[j], awayNums[i]];
            }

            await supabase
              .from('squares_grids')
              .update({ numbers_drawn: true, home_numbers: homeNums, away_numbers: awayNums })
              .eq('id', grid.id);
          }
        }
      }
    } catch (err) {
      console.error('Auto-assign squares failed (non-fatal):', err);
    }
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
