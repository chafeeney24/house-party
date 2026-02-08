import { NextRequest, NextResponse } from 'next/server';

const ESPN_URL = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates=20260208';
const SUPER_BOWL_EVENT_ID = '401772988';

// In-memory cache (per serverless instance)
let cachedData: { data: ESPNResponse; timestamp: number } | null = null;
const CACHE_TTL_PREGAME = 5 * 60 * 1000; // 5 minutes
const CACHE_TTL_LIVE = 30 * 1000;         // 30 seconds
const CACHE_TTL_POST = 60 * 60 * 1000;    // 1 hour

interface ESPNResponse {
  state: 'pre' | 'in' | 'post';
  period: number;
  clock: string;
  detail: string;
  homeTeam: { name: string; abbreviation: string; score: number };
  awayTeam: { name: string; abbreviation: string; score: number };
  quarterScores: { quarter: string; homeScore: number; awayScore: number }[];
  isComplete: boolean;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const now = Date.now();

  // Determine TTL based on game state
  let ttl = CACHE_TTL_PREGAME;
  if (cachedData?.data?.state === 'in') ttl = CACHE_TTL_LIVE;
  if (cachedData?.data?.state === 'post') ttl = CACHE_TTL_POST;

  // Return cached if fresh
  if (cachedData && (now - cachedData.timestamp) < ttl) {
    return NextResponse.json(cachedData.data);
  }

  try {
    const res = await fetch(ESPN_URL, {
      next: { revalidate: 30 },
    });
    const espn = await res.json();

    // Find the Super Bowl event
    const event = espn.events?.find((e: any) => e.id === SUPER_BOWL_EVENT_ID);
    if (!event) {
      return NextResponse.json({ error: 'Game not found', state: 'pre' });
    }

    const competition = event.competitions?.[0];
    const status = competition?.status || event.status;
    const state = (status?.type?.state || 'pre') as 'pre' | 'in' | 'post';
    const period = status?.period || 0;
    const clock = status?.displayClock || '';
    const detail = status?.type?.shortDetail || '';

    // Extract team scores
    const competitors = competition?.competitors || [];
    const homeTeam = competitors.find((c: any) => c.homeAway === 'home');
    const awayTeam = competitors.find((c: any) => c.homeAway === 'away');

    // Build cumulative scores per quarter from linescores
    // ESPN linescores are per-quarter point values, we need cumulative totals
    const homeLinescores = homeTeam?.linescores || [];
    const awayLinescores = awayTeam?.linescores || [];

    let homeCumulative = 0;
    let awayCumulative = 0;
    const quarterScores: { quarter: string; homeScore: number; awayScore: number }[] = [];

    const quarterNames = ['q1', 'q2', 'q3', 'q4'];
    for (let i = 0; i < Math.min(homeLinescores.length, 4); i++) {
      homeCumulative += Number(homeLinescores[i]?.value || 0);
      awayCumulative += Number(awayLinescores[i]?.value || 0);
      quarterScores.push({
        quarter: quarterNames[i],
        homeScore: homeCumulative,
        awayScore: awayCumulative,
      });
    }

    const responseData: ESPNResponse = {
      state,
      period,
      clock,
      detail,
      homeTeam: {
        name: homeTeam?.team?.displayName || 'Home',
        abbreviation: homeTeam?.team?.abbreviation || 'HOM',
        score: Number(homeTeam?.score || 0),
      },
      awayTeam: {
        name: awayTeam?.team?.displayName || 'Away',
        abbreviation: awayTeam?.team?.abbreviation || 'AWY',
        score: Number(awayTeam?.score || 0),
      },
      quarterScores,
      isComplete: state === 'post',
    };

    cachedData = { data: responseData, timestamp: now };
    return NextResponse.json(responseData);
  } catch (err) {
    console.error('ESPN API error:', err);
    // Return stale cache if available
    if (cachedData) {
      return NextResponse.json(cachedData.data);
    }
    return NextResponse.json({ error: 'Failed to fetch scores', state: 'pre' });
  }
}
