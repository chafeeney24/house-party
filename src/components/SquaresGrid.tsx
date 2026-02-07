'use client';

import { useState, useEffect, useCallback } from 'react';
import { SquaresGrid as SquaresGridType, SquareClaim, Quarter } from '@/types';

interface SquaresGridProps {
  partyCode: string;
  guestId: string;
  isHost: boolean;
}

interface WinningSquare {
  quarter: Quarter;
  row: number;
  col: number;
  label: string;
}

export default function SquaresGrid({ partyCode, guestId, isHost }: SquaresGridProps) {
  const [grid, setGrid] = useState<SquaresGridType | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showScoreModal, setShowScoreModal] = useState<Quarter | null>(null);
  const [scoreHome, setScoreHome] = useState('');
  const [scoreAway, setScoreAway] = useState('');

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

  useEffect(() => {
    fetchGrid();
    const interval = setInterval(fetchGrid, 5000);
    return () => clearInterval(interval);
  }, [fetchGrid]);

  const createGrid = async () => {
    setCreating(true);
    try {
      const res = await fetch(`/api/party/${partyCode}/squares`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          teamHome: 'Patriots',
          teamAway: 'Seahawks',
        }),
      });
      if (res.ok) {
        fetchGrid();
      }
    } finally {
      setCreating(false);
    }
  };

  const claimSquare = async (row: number, col: number) => {
    if (!grid || grid.numbersDrawn) return;

    try {
      const res = await fetch(`/api/party/${partyCode}/squares`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-guest-id': guestId,
        },
        body: JSON.stringify({
          action: 'claim',
          rowIndex: row,
          colIndex: col,
        }),
      });
      if (res.ok) {
        fetchGrid();
      }
    } catch (err) {
      console.error('Failed to claim square:', err);
    }
  };

  const unclaimSquare = async (row: number, col: number) => {
    if (!grid || grid.numbersDrawn) return;

    try {
      const res = await fetch(`/api/party/${partyCode}/squares?row=${row}&col=${col}`, {
        method: 'DELETE',
        headers: { 'x-guest-id': guestId },
      });
      if (res.ok) {
        fetchGrid();
      }
    } catch (err) {
      console.error('Failed to unclaim square:', err);
    }
  };

  const drawNumbers = async () => {
    if (!grid || grid.numbersDrawn) return;
    if (!confirm('Draw numbers now? This cannot be undone and locks all squares!')) return;

    try {
      const res = await fetch(`/api/party/${partyCode}/squares`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'draw' }),
      });
      if (res.ok) {
        fetchGrid();
      }
    } catch (err) {
      console.error('Failed to draw numbers:', err);
    }
  };

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

  const claimedCount = grid?.claims.length || 0;
  const myClaimsCount = grid?.claims.filter((c) => c.guestId === guestId).length || 0;

  if (loading) {
    return <div className="text-center text-white py-8">Loading squares...</div>;
  }

  if (!grid) {
    return (
      <div className="text-center py-8">
        <p className="text-white mb-4">No squares grid yet!</p>
        {isHost && (
          <button
            onClick={createGrid}
            disabled={creating}
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg"
          >
            {creating ? 'Creating...' : '🏈 Create Super Bowl Squares'}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold text-white">🏈 Super Bowl Squares</h2>
        <p className="text-blue-300 text-sm">
          {claimedCount}/100 claimed • You have {myClaimsCount} square{myClaimsCount !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Host Controls */}
      {isHost && (
        <div className="flex flex-wrap gap-2 justify-center mb-4">
          {!grid.numbersDrawn && (
            <button
              onClick={drawNumbers}
              disabled={claimedCount === 0}
              className="bg-purple-500 hover:bg-purple-600 disabled:bg-gray-500 text-white font-semibold py-2 px-4 rounded-lg text-sm"
            >
              🎲 Draw Numbers
            </button>
          )}
          {grid.numbersDrawn && (
            <>
              <button
                onClick={() => setShowScoreModal('q1')}
                className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-3 rounded-lg text-sm"
              >
                Q1
              </button>
              <button
                onClick={() => setShowScoreModal('q2')}
                className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-3 rounded-lg text-sm"
              >
                Q2
              </button>
              <button
                onClick={() => setShowScoreModal('q3')}
                className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-3 rounded-lg text-sm"
              >
                Q3
              </button>
              <button
                onClick={() => setShowScoreModal('final')}
                className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 px-3 rounded-lg text-sm"
              >
                Final
              </button>
            </>
          )}
        </div>
      )}

      {/* Scores Display */}
      {grid.numbersDrawn && (
        <div className="flex justify-center gap-4 mb-4 text-sm">
          {grid.q1ScoreHome !== null && (
            <span className="bg-white/20 text-white px-2 py-1 rounded">
              Q1: {grid.q1ScoreAway}-{grid.q1ScoreHome}
            </span>
          )}
          {grid.q2ScoreHome !== null && (
            <span className="bg-white/20 text-white px-2 py-1 rounded">
              Q2: {grid.q2ScoreAway}-{grid.q2ScoreHome}
            </span>
          )}
          {grid.q3ScoreHome !== null && (
            <span className="bg-white/20 text-white px-2 py-1 rounded">
              Q3: {grid.q3ScoreAway}-{grid.q3ScoreHome}
            </span>
          )}
          {grid.finalScoreHome !== null && (
            <span className="bg-yellow-500/30 text-white px-2 py-1 rounded">
              Final: {grid.finalScoreAway}-{grid.finalScoreHome}
            </span>
          )}
        </div>
      )}

      {/* Grid */}
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* Team Home Header */}
          <div className="text-center text-white font-bold text-sm mb-2 ml-10">
            {grid.teamHome} →
          </div>

          {/* Numbers Row (if drawn) */}
          <div className="flex">
            <div className="w-10 h-8" /> {/* Corner spacer */}
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((col) => (
              <div
                key={`header-${col}`}
                className="w-8 h-8 flex items-center justify-center text-white font-bold text-xs bg-blue-800/50 border border-blue-700/50"
              >
                {grid.numbersDrawn && grid.homeNumbers ? grid.homeNumbers[col] : '?'}
              </div>
            ))}
          </div>

          {/* Grid Rows with Away Team Sidebar */}
          <div className="flex">
            {/* Team Away Numbers Column */}
            <div className="w-10 flex flex-col">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((row) => (
                <div
                  key={`sidebar-${row}`}
                  className="h-8 flex items-center justify-center text-white font-bold text-xs bg-green-800/50 border border-green-700/50"
                >
                  {grid.numbersDrawn && grid.awayNumbers ? grid.awayNumbers[row] : '?'}
                </div>
              ))}
            </div>

            {/* Squares Grid */}
            <div>
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((row) => (
                <div key={`row-${row}`} className="flex">
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((col) => {
                    const claim = getClaimForSquare(row, col);
                    const isMine = claim?.guestId === guestId;
                    const winLabel = isWinningSquare(row, col);

                    return (
                      <button
                        key={`${row}-${col}`}
                        onClick={() => {
                          if (claim && isMine && !grid.numbersDrawn) {
                            unclaimSquare(row, col);
                          } else if (!claim && !grid.numbersDrawn) {
                            claimSquare(row, col);
                          }
                        }}
                        disabled={grid.numbersDrawn || (claim && !isMine)}
                        className={`
                          w-8 h-8 flex items-center justify-center text-xs font-bold
                          border border-white/20 transition-all relative
                          ${winLabel ? 'bg-yellow-400 text-black ring-2 ring-yellow-300' : ''}
                          ${!winLabel && claim && isMine ? 'bg-green-500 text-white' : ''}
                          ${!winLabel && claim && !isMine ? 'bg-red-400/70 text-white' : ''}
                          ${!winLabel && !claim ? 'bg-white/10 hover:bg-white/30 text-white/50' : ''}
                          ${grid.numbersDrawn ? 'cursor-default' : claim && !isMine ? 'cursor-not-allowed' : 'cursor-pointer'}
                        `}
                        title={claim ? `${claim.guestName}${isMine ? ' (You)' : ''}` : 'Click to claim'}
                      >
                        {winLabel && (
                          <span className="absolute -top-1 -right-1 bg-yellow-600 text-white text-[8px] px-1 rounded">
                            {winLabel}
                          </span>
                        )}
                        {claim ? getInitials(claim.guestName || '') : ''}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
          
          {/* Team Away Label */}
          <div className="text-center text-white font-bold text-sm mt-2 ml-10">
            ↑ {grid.teamAway}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-4 mt-4 text-xs text-white/70">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 bg-green-500 rounded" /> Yours
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 bg-red-400/70 rounded" /> Taken
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 bg-yellow-400 rounded" /> Winner
        </span>
      </div>

      {/* Winners List */}
      {grid.numbersDrawn && getWinningSquares().length > 0 && (
        <div className="mt-4 bg-white/10 rounded-lg p-4">
          <h3 className="text-white font-bold mb-2">🏆 Winners</h3>
          {getWinningSquares().map((w) => {
            const claim = getClaimForSquare(w.row, w.col);
            return (
              <div key={w.quarter} className="text-white/90 text-sm">
                <span className="font-semibold">{w.label}:</span>{' '}
                {claim ? claim.guestName : 'Unclaimed'}{' '}
                {grid.homeNumbers && grid.awayNumbers && (
                  <span className="text-white/50">
                    ({grid.awayNumbers[w.row]}-{grid.homeNumbers[w.col]})
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Score Modal */}
      {showScoreModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl p-6 max-w-sm w-full">
            <h3 className="text-xl font-bold text-white mb-4">
              Enter {showScoreModal.toUpperCase()} Score
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-white/70 text-sm">{grid.teamAway}</label>
                <input
                  type="number"
                  value={scoreAway}
                  onChange={(e) => setScoreAway(e.target.value)}
                  className="w-full bg-white/10 text-white rounded-lg px-4 py-2 mt-1"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="text-white/70 text-sm">{grid.teamHome}</label>
                <input
                  type="number"
                  value={scoreHome}
                  onChange={(e) => setScoreHome(e.target.value)}
                  className="w-full bg-white/10 text-white rounded-lg px-4 py-2 mt-1"
                  placeholder="0"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowScoreModal(null)}
                className="flex-1 bg-white/20 text-white py-2 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={submitScore}
                className="flex-1 bg-green-500 text-white py-2 rounded-lg font-semibold"
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
