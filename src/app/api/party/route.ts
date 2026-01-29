// POST /api/party - Create a new party

import { NextRequest, NextResponse } from 'next/server';
import { createParty } from '@/lib/store';
import { CreatePartyRequest } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body: CreatePartyRequest = await request.json();
    
    if (!body.name || !body.hostName) {
      return NextResponse.json(
        { error: 'Party name and host name are required' },
        { status: 400 }
      );
    }
    
    const { party, host } = createParty(body.name, body.hostName);
    
    return NextResponse.json({
      party: {
        code: party.code,
        name: party.name,
        id: party.id,
      },
      host: {
        id: host.id,
        name: host.name,
      },
    });
  } catch (error) {
    console.error('Error creating party:', error);
    return NextResponse.json(
      { error: 'Failed to create party' },
      { status: 500 }
    );
  }
}
