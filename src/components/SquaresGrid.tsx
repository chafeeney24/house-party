'use client';

import { useState, useEffect, useCallback, Fragment, useRef } from 'react';
import { SquaresGrid as SquaresGridType, SquareClaim, Quarter } from '@/types';

interface SquaresGridProps {
  partyCode: string;
  guestId: string;
  isHost: boolean;
  wantsSquares?: boolean;
  squaresPlayerCount?: number;
}

interface WinningSquare {
  quarter: Quarter;
  row: number;
  col: number;
  label: string;
}

interface ESPNData {
  state: 'pre' | 'in' | 'post';
  period: number;
  clock: string;
  detail: string;
  homeTeam: { name: string; abbreviation: string; score: number };
  awayTeam: { name: string; abbreviation: string; score: number };
  quarterScores: { quarter: string; homeScore: number; awayScore: number }[];
  isComplete: boolean;
}

// Unique colors for each guest in the grid
const GUEST_COLORS = [
  { bg: 'bg-blue-500', text: 'text-white', hex: '#3b82f6' },
  { bg: 'bg-emerald-500', text: 'text-white', hex: '#10b981' },
  { bg: 'bg-purple-500', text: 'text-white', hex: '#a855f7' },
  { bg: 'bg-pink-500', text: 'text-white', hex: '#ec4899' },
  { bg: 'bg-amber-500', text: 'text-white', hex: '#f59e0b' },
  { bg: 'bg-teal-500', text: 'text-white', hex: '#14b8a6' },
  { bg: 'bg-indigo-500', text: 'text-white', hex: '#6366f1' },
  { bg: 'bg-rose-500', text: 'text-white', hex: '#f43f5e' },
  { bg: 'bg-cyan-500', text: 'text-white', hex: '#06b6d4' },
  { bg: 'bg-lime-500', text: 'text-white', hex: '#84cc16' },
  { bg: 'bg-orange-500', text: 'text-white', hex: '#f97316' },
  { bg: 'bg-violet-500', text: 'text-white', hex: '#8b5cf6' },
];

// Default payout percentages when no custom amounts are set
const DEFAULT_PAYOUT_PCTS = { q1: 0.10, q2: 0.30, q3: 0.10, final: 0.50 };

interface PayoutAmounts {
  q1: number;
  q2: number;
  q3: number;
  final: number;
}

// Get effective payout amounts: use stored values if any are non-zero, else calculate defaults
function getPayouts(grid: SquaresGridType | null, playerCount: number): PayoutAmounts {
  const pot = playerCount * 10;
  if (grid && (grid.payoutQ1 || grid.payoutQ2 || grid.payoutQ3 || grid.payoutFinal)) {
    return { q1: grid.payoutQ1, q2: grid.payoutQ2, q3: grid.payoutQ3, final: grid.payoutFinal };
  }
  return {
    q1: Math.round(pot * DEFAULT_PAYOUT_PCTS.q1),
    q2: Math.round(pot * DEFAULT_PAYOUT_PCTS.q2),
    q3: Math.round(pot * DEFAULT_PAYOUT_PCTS.q3),
    final: Math.round(pot * DEFAULT_PAYOUT_PCTS.final),
  };
}

function PayoutTable({ playerCount, payouts, isHost, onSave }: {
  playerCount: number;
  payouts: PayoutAmounts;
  isHost: boolean;
  onSave?: (payouts: PayoutAmounts) => void;
}) {
  const pot = playerCount * 10;
  const [editing, setEditing] = useState(false);
  const [editQ1, setEditQ1] = useState(String(payouts.q1));
  const [editQ2, setEditQ2] = useState(String(payouts.q2));
  const [editQ3, setEditQ3] = useState(String(payouts.q3));
  const [editFinal, setEditFinal] = useState(String(payouts.final));

  if (pot === 0) return null;

  const quarters = [
    { label: 'Q1', value: payouts.q1 },
    { label: 'Halftime', value: payouts.q2 },
    { label: 'Q3', value: payouts.q3 },
    { label: 'Final', value: payouts.final },
  ];

  const handleEdit = () => {
    setEditQ1(String(payouts.q1));
    setEditQ2(String(payouts.q2));
    setEditQ3(String(payouts.q3));
    setEditFinal(String(payouts.final));
    setEditing(true);
  };

  const handleSave = () => {
    const newPayouts: PayoutAmounts = {
      q1: parseInt(editQ1) || 0,
      q2: parseInt(editQ2) || 0,
      q3: parseInt(editQ3) || 0,
      final: parseInt(editFinal) || 0,
    };
    onSave?.(newPayouts);
    setEditing(false);
  };

  if (editing) {
    const total = (parseInt(editQ1) || 0) + (parseInt(editQ2) || 0) + (parseInt(editQ3) || 0) + (parseInt(editFinal) || 0);
    const isBalanced = total === pot;

    return (
      <div className="bg-white/5 border border-white/10 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-bold text-sm">💰 Edit Payouts</h3>
          <span className={`text-sm font-semibold ${isBalanced ? 'text-emerald-400' : 'text-red-400'}`}>
            ${total} / ${pot}
          </span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Q1', value: editQ1, setter: setEditQ1 },
            { label: 'Halftime', value: editQ2, setter: setEditQ2 },
            { label: 'Q3', value: editQ3, setter: setEditQ3 },
            { label: 'Final', value: editFinal, setter: setEditFinal },
          ].map(({ label, value, setter }) => (
            <div key={label} className="text-center">
              <div className="text-white/50 text-[10px] uppercase tracking-wider mb-1">{label}</div>
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-white/40 text-sm">$</span>
                <input
                  type="number"
                  inputMode="numeric"
                  value={value}
                  onChange={(e) => setter(e.target.value)}
                  className="w-full bg-white/10 text-white text-center rounded-lg py-2 px-1 pl-5 border border-white/20 focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm font-bold"
                />
              </div>
              {pot > 0 && (
                <div className="text-white/30 text-[10px] mt-1">{Math.round(((parseInt(value) || 0) / pot) * 100)}%</div>
              )}
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => setEditing(false)}
            className="flex-1 bg-white/10 text-white/60 py-2 rounded-lg text-xs font-medium border border-white/10"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white py-2 rounded-lg text-xs font-bold"
          >
            Save
          </button>
        </div>
        {!isBalanced && (
          <p className="text-red-400/70 text-[10px] mt-2 text-center">
            Total doesn&apos;t match ${pot} pot — {total < pot ? `$${pot - total} unallocated` : `$${total - pot} over`}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-bold text-sm">💰 Payouts</h3>
        <div className="flex items-center gap-2">
          <span className="text-emerald-400 text-sm font-semibold">${pot} pot</span>
          {isHost && onSave && (
            <button
              onClick={handleEdit}
              className="text-orange-400 hover:text-orange-300 text-xs font-medium"
            >
              ✏️ Edit
            </button>
          )}
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {quarters.map(({ label, value }) => (
          <div key={label} className="text-center">
            <div className="text-white/50 text-[10px] uppercase tracking-wider mb-1">{label}</div>
            <div className="text-white font-bold text-sm">${value}</div>
            {pot > 0 && (
              <div className="text-white/30 text-[10px]">{Math.round((value / pot) * 100)}%</div>
            )}
          </div>
        ))}
      </div>
      <p className="text-white/30 text-[10px] mt-2 text-center">
        $10 buy-in &middot; {playerCount} player{playerCount !== 1 ? 's' : ''} &middot; Final includes OT
      </p>
    </div>
  );
}

export default function SquaresGrid({ partyCode, guestId, isHost, wantsSquares, squaresPlayerCount }: SquaresGridProps) {
  const [grid, setGrid] = useState<SquaresGridType | null>(null);
  const [loading, setLoading] = useState(true);
  const [showScoreModal, setShowScoreModal] = useState<Quarter | null>(null);
  const [scoreHome, setScoreHome] = useState('');
  const [scoreAway, setScoreAway] = useState('');
  const [liveData, setLiveData] = useState<ESPNData | null>(null);
  const autoScoredRef = useRef<Set<string>>(new Set());

  const fetchGrid = useCallback(async () => {
    try {
      const res = await fetch(`/api/party/${partyCode}/squares`);
      if (res.ok) {
        const data = await res.json();
        setGrid(data.grid);
      }
    } catch (err) {
      console.error('Failed to fetch squares grid:', err);
    } finally {
      setLoading(false);
    }
  }, [partyCode]);

  // Poll grid data
  useEffect(() => {
    fetchGrid();
    const interval = setInterval(fetchGrid, 5000);
    return () => clearInterval(interval);
  }, [fetchGrid]);

  // Poll ESPN live scores
  useEffect(() => {
    if (!grid?.numbersDrawn) return;

    const fetchESPN = async () => {
      try {
        const res = await fetch(`/api/party/${partyCode}/espn`);
        if (res.ok) {
          const data = await res.json();
          if (!data.error) {
            setLiveData(data);
          }
        }
      } catch (err) {
        console.error('ESPN fetch failed:', err);
      }
    };

    fetchESPN();
    // Poll more frequently during live game
    const intervalMs = liveData?.state === 'in' ? 30000 : 300000;
    const interval = setInterval(fetchESPN, intervalMs);
    return () => clearInterval(interval);
  }, [partyCode, grid?.numbersDrawn, liveData?.state]);

  // Auto-submit scores from ESPN (host only)
  useEffect(() => {
    if (!isHost || !liveData || !grid?.numbersDrawn) return;
    if (liveData.state === 'pre') return;

    const submitQuarterScore = async (quarter: string, homeScore: number, awayScore: number) => {
      const key = `${quarter}-${homeScore}-${awayScore}`;
      if (autoScoredRef.current.has(key)) return;
      autoScoredRef.current.add(key);

      try {
        await fetch(`/api/party/${partyCode}/squares`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'score',
            quarter,
            homeScore,
            awayScore,
          }),
        });
        fetchGrid();
      } catch (err) {
        console.error('Auto-score failed:', err);
        autoScoredRef.current.delete(key);
      }
    };

    for (const qs of liveData.quarterScores) {
      const quarterKey = qs.quarter === 'q4' ? 'final' : qs.quarter;

      // Check if this quarter is already scored in the grid
      let alreadyScored = false;
      if (quarterKey === 'q1' && grid.q1ScoreHome !== null) alreadyScored = true;
      if (quarterKey === 'q2' && grid.q2ScoreHome !== null) alreadyScored = true;
      if (quarterKey === 'q3' && grid.q3ScoreHome !== null) alreadyScored = true;
      if (quarterKey === 'final' && grid.finalScoreHome !== null) alreadyScored = true;

      // Only auto-submit if the quarter is completed and not already saved
      // For non-final quarters, we can submit once the period advances past that quarter
      if (!alreadyScored) {
        const periodNum = parseInt(qs.quarter.replace('q', ''));
        const isQuarterDone = liveData.period > periodNum || liveData.isComplete;

        if (quarterKey === 'final' && liveData.isComplete) {
          submitQuarterScore('final', qs.homeScore, qs.awayScore);
        } else if (quarterKey !== 'final' && isQuarterDone) {
          submitQuarterScore(quarterKey, qs.homeScore, qs.awayScore);
        }
      }
    }
  }, [isHost, liveData, grid, partyCode, fetchGrid]);

  const submitScore = async () => {
    if (!showScoreModal) return;

    try {
      const res = await fetch(`/api/party/${partyCode}/squares`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'score',
          quarter: showScoreModal,
          homeScore: parseInt(scoreHome) || 0,
          awayScore: parseInt(scoreAway) || 0,
        }),
      });
      if (res.ok) {
        fetchGrid();
        setShowScoreModal(null);
        setScoreHome('');
        setScoreAway('');
      }
    } catch (err) {
      console.error('Failed to submit score:', err);
    }
  };

  const getClaimForSquare = (row: number, col: number): SquareClaim | undefined => {
    return grid?.claims.find((c) => c.rowIndex === row && c.colIndex === col);
  };

  const getWinningSquares = (): WinningSquare[] => {
    if (!grid || !grid.numbersDrawn || !grid.homeNumbers || !grid.awayNumbers) return [];

    const winners: WinningSquare[] = [];
    const quarters: { key: Quarter; homeScore: number | null; awayScore: number | null; label: string }[] = [
      { key: 'q1', homeScore: grid.q1ScoreHome, awayScore: grid.q1ScoreAway, label: 'Q1' },
      { key: 'q2', homeScore: grid.q2ScoreHome, awayScore: grid.q2ScoreAway, label: 'Q2' },
      { key: 'q3', homeScore: grid.q3ScoreHome, awayScore: grid.q3ScoreAway, label: 'Q3' },
      { key: 'final', homeScore: grid.finalScoreHome, awayScore: grid.finalScoreAway, label: 'Final' },
    ];

    for (const q of quarters) {
      if (q.homeScore !== null && q.awayScore !== null) {
        const homeDigit = q.homeScore % 10;
        const awayDigit = q.awayScore % 10;
        const col = grid.homeNumbers.indexOf(homeDigit);
        const row = grid.awayNumbers.indexOf(awayDigit);
        if (col !== -1 && row !== -1) {
          winners.push({ quarter: q.key, row, col, label: q.label });
        }
      }
    }

    return winners;
  };

  const isWinningSquare = (row: number, col: number): string | null => {
    const winners = getWinningSquares();
    const win = winners.find((w) => w.row === row && w.col === col);
    return win ? win.label : null;
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Build a stable guest-to-color map
  const getGuestColorMap = (): Map<string, typeof GUEST_COLORS[0]> => {
    if (!grid) return new Map();
    const uniqueGuestIds = [...new Set(grid.claims.map((c) => c.guestId))];
    const map = new Map<string, typeof GUEST_COLORS[0]>();
    uniqueGuestIds.forEach((id, index) => {
      map.set(id, GUEST_COLORS[index % GUEST_COLORS.length]);
    });
    return map;
  };

  const guestColorMap = getGuestColorMap();

  const claimedCount = grid?.claims.length || 0;
  const myClaimsCount = grid?.claims.filter((c) => c.guestId === guestId).length || 0;

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block w-6 h-6 border-2 border-white/30 border-t-orange-400 rounded-full animate-spin" />
        <p className="text-white/60 mt-2 text-sm">Loading squares...</p>
      </div>
    );
  }

  // No grid yet and not assigned
  if (!grid || !grid.numbersDrawn) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
          <div className="text-4xl mb-3">🏈</div>
          <h3 className="text-lg font-bold text-white mb-2">Super Bowl Squares</h3>
          <p className="text-white/60 text-sm">
            Squares will be randomly assigned to opted-in players when the host locks predictions.
          </p>
          {grid && (
            <p className="text-orange-300 text-sm mt-3">
              {grid.teamAway} vs {grid.teamHome}
            </p>
          )}
          {!isHost && wantsSquares !== undefined && (
            <div className={`mt-4 py-2 px-4 rounded-lg text-sm font-medium inline-block ${
              wantsSquares
                ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                : 'bg-white/5 border border-white/10 text-white/50'
            }`}>
              {wantsSquares
                ? "✅ You're in! ($10 buy-in)"
                : "You haven't opted in — ask the host to add you"}
            </div>
          )}
        </div>
        {squaresPlayerCount !== undefined && squaresPlayerCount > 0 && (
          <div className="mt-4">
            <PayoutTable
              playerCount={squaresPlayerCount}
              payouts={getPayouts(grid, squaresPlayerCount)}
              isHost={false}
            />
            {isHost && (
              <p className="text-white/30 text-[10px] mt-2 text-center">
                You can customize payouts after locking predictions
              </p>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Live Scoreboard */}
      {liveData && liveData.state !== 'pre' && (
        <div className="bg-gradient-to-r from-[#1a1a2e] to-[#16213e] border border-white/10 rounded-xl p-4 mb-4">
          <div className="flex justify-between items-center max-w-xs mx-auto">
            <div className="text-center min-w-[60px]">
              <div className="text-white/50 text-[10px] font-medium uppercase tracking-wider">{liveData.awayTeam.abbreviation}</div>
              <div className="text-3xl font-bold text-white">{liveData.awayTeam.score}</div>
            </div>
            <div className="text-center px-3">
              {liveData.state === 'in' && (
                <div className="flex items-center justify-center gap-1.5 mb-0.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                  <span className="text-red-400 text-[10px] font-bold uppercase">Live</span>
                </div>
              )}
              <div className="text-orange-300 text-xs font-semibold">{liveData.detail}</div>
              {liveData.state === 'in' && liveData.clock && (
                <div className="text-white/40 text-sm font-mono">{liveData.clock}</div>
              )}
            </div>
            <div className="text-center min-w-[60px]">
              <div className="text-white/50 text-[10px] font-medium uppercase tracking-wider">{liveData.homeTeam.abbreviation}</div>
              <div className="text-3xl font-bold text-white">{liveData.homeTeam.score}</div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-3">
        <h2 className="text-lg font-bold text-white">🏈 Super Bowl Squares</h2>
        <p className="text-white/50 text-xs">
          {claimedCount}/100 claimed &middot; You have {myClaimsCount} square{myClaimsCount !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Host Score Controls (fallback) */}
      {isHost && grid.numbersDrawn && (
        <div className="flex flex-wrap gap-2 justify-center mb-3">
          {[
            { q: 'q1' as Quarter, label: 'Q1', scored: grid.q1ScoreHome !== null },
            { q: 'q2' as Quarter, label: 'Q2', scored: grid.q2ScoreHome !== null },
            { q: 'q3' as Quarter, label: 'Q3', scored: grid.q3ScoreHome !== null },
            { q: 'final' as Quarter, label: 'Final', scored: grid.finalScoreHome !== null },
          ].map(({ q, label, scored }) => (
            <button
              key={q}
              onClick={() => setShowScoreModal(q)}
              className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-colors ${
                scored
                  ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                  : 'bg-white/10 text-white/70 hover:bg-white/20 border border-white/10'
              }`}
            >
              {scored ? `✓ ${label}` : label}
            </button>
          ))}
        </div>
      )}

      {/* Scores Display */}
      {grid.numbersDrawn && (grid.q1ScoreHome !== null || grid.q2ScoreHome !== null || grid.q3ScoreHome !== null || grid.finalScoreHome !== null) && (
        <div className="flex justify-center gap-2 mb-3 flex-wrap">
          {grid.q1ScoreHome !== null && (
            <span className="bg-white/10 text-white/80 text-xs px-2 py-1 rounded-md">
              Q1: {grid.q1ScoreAway}-{grid.q1ScoreHome}
            </span>
          )}
          {grid.q2ScoreHome !== null && (
            <span className="bg-white/10 text-white/80 text-xs px-2 py-1 rounded-md">
              Q2: {grid.q2ScoreAway}-{grid.q2ScoreHome}
            </span>
          )}
          {grid.q3ScoreHome !== null && (
            <span className="bg-white/10 text-white/80 text-xs px-2 py-1 rounded-md">
              Q3: {grid.q3ScoreAway}-{grid.q3ScoreHome}
            </span>
          )}
          {grid.finalScoreHome !== null && (
            <span className="bg-orange-500/20 text-orange-300 text-xs px-2 py-1 rounded-md font-semibold">
              Final: {grid.finalScoreAway}-{grid.finalScoreHome}
            </span>
          )}
        </div>
      )}

      {/* Grid */}
      <div className="w-full max-w-[500px] mx-auto px-1">
        {/* Home team header */}
        <div className="text-center text-xs font-bold text-white/70 mb-1" style={{ paddingLeft: '10%' }}>
          {grid.teamHome} &rarr;
        </div>

        {/* 11x11 CSS Grid: header row + header col + 10x10 squares */}
        <div
          className="grid w-full"
          style={{
            gridTemplateColumns: '10% repeat(10, 1fr)',
            gridTemplateRows: '8% repeat(10, 1fr)',
            aspectRatio: '11 / 11.2',
            gap: '1px',
          }}
        >
          {/* Corner cell */}
          <div className="rounded-tl-lg" />

          {/* Header row (home numbers) */}
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((col) => (
            <div
              key={`h-${col}`}
              className={`flex items-center justify-center text-white font-bold text-[10px] sm:text-xs bg-blue-900/60 ${col === 9 ? 'rounded-tr-lg' : ''}`}
            >
              {grid.homeNumbers ? grid.homeNumbers[col] : '?'}
            </div>
          ))}

          {/* Grid rows */}
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((row) => (
            <Fragment key={`row-${row}`}>
              {/* Sidebar cell (away number) */}
              <div
                className={`flex items-center justify-center text-white font-bold text-[10px] sm:text-xs bg-green-900/60 ${row === 9 ? 'rounded-bl-lg' : ''}`}
              >
                {grid.awayNumbers ? grid.awayNumbers[row] : '?'}
              </div>

              {/* 10 square cells */}
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((col) => {
                const claim = getClaimForSquare(row, col);
                const isMine = claim?.guestId === guestId;
                const winLabel = isWinningSquare(row, col);
                const color = claim ? guestColorMap.get(claim.guestId) : null;

                return (
                  <div
                    key={`${row}-${col}`}
                    className={`
                      flex items-center justify-center text-[9px] sm:text-[10px] font-bold relative
                      transition-all
                      ${winLabel ? 'bg-yellow-400 text-black ring-1 ring-yellow-300 z-10 animate-winner-glow' : ''}
                      ${!winLabel && claim && isMine ? `${color?.bg || 'bg-blue-500'} ${color?.text || 'text-white'} ring-1 ring-white/30` : ''}
                      ${!winLabel && claim && !isMine ? `${color?.bg || 'bg-gray-500'} ${color?.text || 'text-white'} opacity-70` : ''}
                      ${!winLabel && !claim ? 'bg-white/5 text-white/20' : ''}
                      ${row === 9 && col === 9 ? 'rounded-br-lg' : ''}
                    `}
                    title={claim ? `${claim.guestName}${isMine ? ' (You)' : ''}` : 'Empty'}
                  >
                    {winLabel && (
                      <span className="absolute -top-1 -right-1 bg-yellow-600 text-white text-[6px] px-0.5 rounded z-20 leading-tight">
                        {winLabel}
                      </span>
                    )}
                    {claim ? getInitials(claim.guestName || '') : ''}
                  </div>
                );
              })}
            </Fragment>
          ))}
        </div>

        {/* Away team label */}
        <div className="text-center text-xs font-bold text-white/70 mt-1" style={{ paddingLeft: '10%' }}>
          &uarr; {grid.teamAway}
        </div>
      </div>

      {/* Legend - Guest Colors */}
      <div className="flex flex-wrap justify-center gap-2 mt-4 px-2">
        {[...guestColorMap.entries()].map(([gId, color]) => {
          const claim = grid.claims.find((c) => c.guestId === gId);
          const name = claim?.guestName || 'Unknown';
          const count = grid.claims.filter((c) => c.guestId === gId).length;
          const isMe = gId === guestId;
          return (
            <span
              key={gId}
              className={`flex items-center gap-1 text-[10px] sm:text-xs text-white/80 ${isMe ? 'font-bold' : ''}`}
            >
              <span className={`w-2.5 h-2.5 rounded-sm ${color.bg}`} />
              {name}{isMe ? ' (You)' : ''} <span className="text-white/40">{count}</span>
            </span>
          );
        })}
      </div>

      {/* Your Squares - show assigned numbers */}
      {grid.numbersDrawn && grid.homeNumbers && grid.awayNumbers && myClaimsCount > 0 && (
        <div className="mt-4 bg-white/5 border border-white/10 rounded-xl p-4">
          <h3 className="text-white font-bold mb-2 text-sm">🎯 Your Squares</h3>
          <p className="text-white/40 text-xs mb-3">
            You need the last digit of each team&apos;s score to match one of these pairs:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {grid.claims
              .filter((c) => c.guestId === guestId)
              .map((c) => {
                const homeNum = grid.homeNumbers![c.colIndex];
                const awayNum = grid.awayNumbers![c.rowIndex];
                const winLabel = isWinningSquare(c.rowIndex, c.colIndex);
                return (
                  <div
                    key={`my-${c.rowIndex}-${c.colIndex}`}
                    className={`flex items-center justify-between py-2 px-3 rounded-lg text-sm ${
                      winLabel
                        ? 'bg-yellow-400/20 border border-yellow-400/40 text-yellow-300'
                        : 'bg-white/5 text-white/80'
                    }`}
                  >
                    <span>
                      <span className="text-white/50 text-xs">{grid.teamHome} </span>
                      <span className="font-bold">{homeNum}</span>
                      <span className="text-white/30 mx-1">–</span>
                      <span className="text-white/50 text-xs">{grid.teamAway} </span>
                      <span className="font-bold">{awayNum}</span>
                    </span>
                    {winLabel && (
                      <span className="text-yellow-400 text-xs font-bold ml-2">🏆 {winLabel}</span>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Payouts */}
      {squaresPlayerCount !== undefined && squaresPlayerCount > 0 && (
        <div className="mt-4">
          <PayoutTable
            playerCount={squaresPlayerCount}
            payouts={getPayouts(grid, squaresPlayerCount)}
            isHost={isHost}
            onSave={async (newPayouts) => {
              // Optimistic update
              if (grid) {
                setGrid({ ...grid, payoutQ1: newPayouts.q1, payoutQ2: newPayouts.q2, payoutQ3: newPayouts.q3, payoutFinal: newPayouts.final });
              }
              try {
                const res = await fetch(`/api/party/${partyCode}/squares`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    action: 'update-payouts',
                    payoutQ1: newPayouts.q1,
                    payoutQ2: newPayouts.q2,
                    payoutQ3: newPayouts.q3,
                    payoutFinal: newPayouts.final,
                  }),
                });
                if (!res.ok) fetchGrid();
              } catch (err) {
                console.error('Failed to save payouts:', err);
                fetchGrid();
              }
            }}
          />
        </div>
      )}

      {/* Winners List */}
      {grid.numbersDrawn && getWinningSquares().length > 0 && (() => {
        const effectivePayouts = getPayouts(grid, squaresPlayerCount || 0);
        return (
          <div className="mt-4 bg-white/5 border border-white/10 rounded-xl p-4">
            <h3 className="text-white font-bold mb-2 text-sm">🏆 Winners</h3>
            {getWinningSquares().map((w) => {
              const claim = getClaimForSquare(w.row, w.col);
              const color = claim ? guestColorMap.get(claim.guestId) : null;
              const payout = w.label === 'Q1' ? effectivePayouts.q1
                : w.label === 'Q2' ? effectivePayouts.q2
                : w.label === 'Q3' ? effectivePayouts.q3
                : effectivePayouts.final;
              return (
                <div key={w.quarter} className="flex items-center gap-2 text-sm py-1">
                  <span className="text-orange-300 font-semibold w-10">{w.label}</span>
                  {claim ? (
                    <span className="flex items-center gap-1.5">
                      <span className={`w-2.5 h-2.5 rounded-sm ${color?.bg || 'bg-gray-500'}`} />
                      <span className="text-white">{claim.guestName}</span>
                    </span>
                  ) : (
                    <span className="text-white/40">Unclaimed</span>
                  )}
                  <span className="ml-auto flex items-center gap-2">
                    {payout > 0 && (
                      <span className="text-emerald-400 text-xs font-bold">${payout}</span>
                    )}
                    {grid.homeNumbers && grid.awayNumbers && (
                      <span className="text-white/30 text-xs">
                        ({grid.awayNumbers[w.row]}-{grid.homeNumbers[w.col]})
                      </span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* Score Modal (fallback for manual entry) */}
      {showScoreModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0f1f3a] border border-white/10 rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-white mb-4">
              Enter {showScoreModal === 'final' ? 'Final' : showScoreModal.toUpperCase()} Score
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-white/60 text-sm">{grid.teamAway}</label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={scoreAway}
                  onChange={(e) => setScoreAway(e.target.value)}
                  className="w-full bg-white/10 text-white rounded-lg px-4 py-3 mt-1 border border-white/10 focus:outline-none focus:ring-2 focus:ring-orange-400 text-lg"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="text-white/60 text-sm">{grid.teamHome}</label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={scoreHome}
                  onChange={(e) => setScoreHome(e.target.value)}
                  className="w-full bg-white/10 text-white rounded-lg px-4 py-3 mt-1 border border-white/10 focus:outline-none focus:ring-2 focus:ring-orange-400 text-lg"
                  placeholder="0"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowScoreModal(null)}
                className="flex-1 bg-white/10 text-white py-3 rounded-lg font-medium border border-white/10"
              >
                Cancel
              </button>
              <button
                onClick={submitScore}
                className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white py-3 rounded-lg font-bold"
              >
                Save Score
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
