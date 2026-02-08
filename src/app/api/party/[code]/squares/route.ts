import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Fisher-Yates shuffle for numbers
function shuffleArray(array: number[]): number[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Generic Fisher-Yates shuffle
function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// GET - Get squares grid for party
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  // Get party
  const { data: party } = await supabase
    .from('parties')
    .select('id')
    .eq('code', code.toUpperCase())
    .single();

  if (!party) {
    return NextResponse.json({ error: 'Party not found' }, { status: 404 });
  }

  // Get grid
  const { data: grid } = await supabase
    .from('squares_grids')
    .select('*')
    .eq('party_id', party.id)
    .single();

  if (!grid) {
    return NextResponse.json({ grid: null });
  }

  // Get claims with guest names
  const { data: claims } = await supabase
    .from('squares_claims')
    .select(`
      id,
      grid_id,
      guest_id,
      row_index,
      col_index,
      guests (name)
    `)
    .eq('grid_id', grid.id);

  const formattedClaims = (claims || []).map((claim: any) => ({
    id: claim.id,
    gridId: claim.grid_id,
    guestId: claim.guest_id,
    guestName: claim.guests?.name || 'Unknown',
    rowIndex: claim.row_index,
    colIndex: claim.col_index,
  }));

  return NextResponse.json({
    grid: {
      id: grid.id,
      partyId: grid.party_id,
      teamHome: grid.team_home,
      teamAway: grid.team_away,
      numbersDrawn: grid.numbers_drawn,
      homeNumbers: grid.home_numbers,
      awayNumbers: grid.away_numbers,
      q1ScoreHome: grid.q1_score_home,
      q1ScoreAway: grid.q1_score_away,
      q2ScoreHome: grid.q2_score_home,
      q2ScoreAway: grid.q2_score_away,
      q3ScoreHome: grid.q3_score_home,
      q3ScoreAway: grid.q3_score_away,
      finalScoreHome: grid.final_score_home,
      finalScoreAway: grid.final_score_away,
      payoutQ1: grid.payout_q1,
      payoutQ2: grid.payout_q2,
      payoutQ3: grid.payout_q3,
      payoutFinal: grid.payout_final,
      claims: formattedClaims,
    },
  });
}

// POST - Create grid or claim square
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const body = await request.json();
  const guestId = request.headers.get('x-guest-id');

  // Get party
  const { data: party } = await supabase
    .from('parties')
    .select('id')
    .eq('code', code.toUpperCase())
    .single();

  if (!party) {
    return NextResponse.json({ error: 'Party not found' }, { status: 404 });
  }

  // Action: create grid
  if (body.action === 'create') {
    const { teamHome, teamAway } = body;

    // Check if grid already exists
    const { data: existingGrid } = await supabase
      .from('squares_grids')
      .select('id')
      .eq('party_id', party.id)
      .single();

    if (existingGrid) {
      return NextResponse.json({ error: 'Grid already exists' }, { status: 400 });
    }

    const { data: grid, error } = await supabase
      .from('squares_grids')
      .insert({
        party_id: party.id,
        team_home: teamHome || 'Patriots',
        team_away: teamAway || 'Seahawks',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ grid });
  }

  // Action: claim square
  if (body.action === 'claim') {
    const { rowIndex, colIndex } = body;

    if (!guestId) {
      return NextResponse.json({ error: 'Guest ID required' }, { status: 401 });
    }

    // Get grid
    const { data: grid } = await supabase
      .from('squares_grids')
      .select('id, numbers_drawn')
      .eq('party_id', party.id)
      .single();

    if (!grid) {
      return NextResponse.json({ error: 'Grid not found' }, { status: 404 });
    }

    if (grid.numbers_drawn) {
      return NextResponse.json({ error: 'Numbers already drawn, cannot claim' }, { status: 400 });
    }

    // Check if square already claimed
    const { data: existingClaim } = await supabase
      .from('squares_claims')
      .select('id')
      .eq('grid_id', grid.id)
      .eq('row_index', rowIndex)
      .eq('col_index', colIndex)
      .single();

    if (existingClaim) {
      return NextResponse.json({ error: 'Square already claimed' }, { status: 400 });
    }

    const { data: claim, error } = await supabase
      .from('squares_claims')
      .insert({
        grid_id: grid.id,
        guest_id: guestId,
        row_index: rowIndex,
        col_index: colIndex,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ claim });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}

// PATCH - Draw numbers or update scores
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const body = await request.json();

  // Get party
  const { data: party } = await supabase
    .from('parties')
    .select('id')
    .eq('code', code.toUpperCase())
    .single();

  if (!party) {
    return NextResponse.json({ error: 'Party not found' }, { status: 404 });
  }

  // Get grid
  const { data: grid } = await supabase
    .from('squares_grids')
    .select('*')
    .eq('party_id', party.id)
    .single();

  if (!grid) {
    return NextResponse.json({ error: 'Grid not found' }, { status: 404 });
  }

  // Action: draw numbers
  if (body.action === 'draw') {
    if (grid.numbers_drawn) {
      return NextResponse.json({ error: 'Numbers already drawn' }, { status: 400 });
    }

    const homeNumbers = shuffleArray([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    const awayNumbers = shuffleArray([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);

    const { error } = await supabase
      .from('squares_grids')
      .update({
        numbers_drawn: true,
        home_numbers: homeNumbers,
        away_numbers: awayNumbers,
      })
      .eq('id', grid.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ homeNumbers, awayNumbers });
  }

  // Action: update scores
  if (body.action === 'score') {
    const { quarter, homeScore, awayScore } = body;

    const updateData: any = {};
    if (quarter === 'q1') {
      updateData.q1_score_home = homeScore;
      updateData.q1_score_away = awayScore;
    } else if (quarter === 'q2') {
      updateData.q2_score_home = homeScore;
      updateData.q2_score_away = awayScore;
    } else if (quarter === 'q3') {
      updateData.q3_score_home = homeScore;
      updateData.q3_score_away = awayScore;
    } else if (quarter === 'final') {
      updateData.final_score_home = homeScore;
      updateData.final_score_away = awayScore;
    } else {
      return NextResponse.json({ error: 'Invalid quarter' }, { status: 400 });
    }

    const { error } = await supabase
      .from('squares_grids')
      .update(updateData)
      .eq('id', grid.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  }

  // Action: update teams
  if (body.action === 'updateTeams') {
    const { teamHome, teamAway } = body;

    const { error } = await supabase
      .from('squares_grids')
      .update({
        team_home: teamHome,
        team_away: teamAway,
      })
      .eq('id', grid.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  }

  // Action: auto-assign all squares to guests and draw numbers
  if (body.action === 'auto-assign') {
    if (grid.numbers_drawn) {
      return NextResponse.json({ error: 'Squares already assigned' }, { status: 400 });
    }

    // Get guests who opted in to squares
    const { data: guests } = await supabase
      .from('guests')
      .select('id')
      .eq('party_id', party.id)
      .eq('wants_squares', true);

    if (!guests || guests.length === 0) {
      return NextResponse.json({ error: 'No guests opted in to squares' }, { status: 400 });
    }

    // Clear any existing manual claims
    await supabase
      .from('squares_claims')
      .delete()
      .eq('grid_id', grid.id);

    // Create all 100 square positions and shuffle them
    const positions: [number, number][] = [];
    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 10; c++) {
        positions.push([r, c]);
      }
    }
    const shuffledPositions = shuffle(positions);

    // Shuffle guest order for fair distribution
    const shuffledGuestIds = shuffle(guests.map(g => g.id));

    // Assign squares round-robin across shuffled positions
    const allSquares = shuffledPositions.map(([row, col], index) => ({
      grid_id: grid.id,
      guest_id: shuffledGuestIds[index % shuffledGuestIds.length],
      row_index: row,
      col_index: col,
    }));

    // Batch insert all claims
    const { error: claimError } = await supabase
      .from('squares_claims')
      .insert(allSquares);

    if (claimError) {
      return NextResponse.json({ error: claimError.message }, { status: 500 });
    }

    // Auto-draw numbers
    const homeNumbers = shuffleArray([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    const awayNumbers = shuffleArray([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);

    const { error: drawError } = await supabase
      .from('squares_grids')
      .update({
        numbers_drawn: true,
        home_numbers: homeNumbers,
        away_numbers: awayNumbers,
      })
      .eq('id', grid.id);

    if (drawError) {
      return NextResponse.json({ error: drawError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      squaresAssigned: 100,
      guestCount: guests.length,
      squaresPerGuest: Math.floor(100 / guests.length),
    });
  }

  // Action: update payout amounts
  if (body.action === 'update-payouts') {
    const { payoutQ1, payoutQ2, payoutQ3, payoutFinal } = body;

    if ([payoutQ1, payoutQ2, payoutQ3, payoutFinal].some(v => typeof v !== 'number' || v < 0)) {
      return NextResponse.json({ error: 'All payout values must be non-negative numbers' }, { status: 400 });
    }

    const { error } = await supabase
      .from('squares_grids')
      .update({
        payout_q1: payoutQ1,
        payout_q2: payoutQ2,
        payout_q3: payoutQ3,
        payout_final: payoutFinal,
      })
      .eq('id', grid.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}

// DELETE - Unclaim square
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const { searchParams } = new URL(request.url);
  const rowIndex = parseInt(searchParams.get('row') || '');
  const colIndex = parseInt(searchParams.get('col') || '');
  const guestId = request.headers.get('x-guest-id');

  if (isNaN(rowIndex) || isNaN(colIndex)) {
    return NextResponse.json({ error: 'Row and col required' }, { status: 400 });
  }

  // Get party
  const { data: party } = await supabase
    .from('parties')
    .select('id')
    .eq('code', code.toUpperCase())
    .single();

  if (!party) {
    return NextResponse.json({ error: 'Party not found' }, { status: 404 });
  }

  // Get grid
  const { data: grid } = await supabase
    .from('squares_grids')
    .select('id, numbers_drawn')
    .eq('party_id', party.id)
    .single();

  if (!grid) {
    return NextResponse.json({ error: 'Grid not found' }, { status: 404 });
  }

  if (grid.numbers_drawn) {
    return NextResponse.json({ error: 'Numbers already drawn, cannot unclaim' }, { status: 400 });
  }

  // Delete claim (only own claims unless host)
  const { error } = await supabase
    .from('squares_claims')
    .delete()
    .eq('grid_id', grid.id)
    .eq('row_index', rowIndex)
    .eq('col_index', colIndex)
    .eq('guest_id', guestId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
