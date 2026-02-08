// DELETE /api/party/[code]/guests/[guestId] - Remove a guest from the party

import { NextRequest, NextResponse } from 'next/server';
import { getPartyByCode, removeGuest } from '@/lib/store';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ code: string; guestId: string }> }
) {
  const { code, guestId: targetGuestId } = await params;

  // Verify party exists
  const party = await getPartyByCode(code);
  if (!party) {
    return NextResponse.json(
      { error: 'Party not found' },
      { status: 404 }
    );
  }

  // Verify the requester is the host
  const requestingGuestId = request.headers.get('x-guest-id');
  if (!requestingGuestId) {
    return NextResponse.json(
      { error: 'Missing guest ID' },
      { status: 401 }
    );
  }

  const requestingGuest = party.guests.find(g => g.id === requestingGuestId);
  if (!requestingGuest || !requestingGuest.isHost) {
    return NextResponse.json(
      { error: 'Only the host can remove guests' },
      { status: 403 }
    );
  }

  // Don't allow removing the host
  const targetGuest = party.guests.find(g => g.id === targetGuestId);
  if (!targetGuest) {
    return NextResponse.json(
      { error: 'Guest not found' },
      { status: 404 }
    );
  }

  if (targetGuest.isHost) {
    return NextResponse.json(
      { error: 'Cannot remove the host' },
      { status: 400 }
    );
  }

  const success = await removeGuest(targetGuestId, code);

  if (!success) {
    return NextResponse.json(
      { error: 'Failed to remove guest' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, removedGuest: targetGuest.name });
}
