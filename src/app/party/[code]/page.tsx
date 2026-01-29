'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Game, LeaderboardEntry } from '@/types';

interface PartyData {
  code: string;
  name: string;
  isLocked: boolean;
  games: Game[];
  guests: { id: string; name: string; isHost: boolean }[];
}

interface PredictionMap {
  [gameId: string]: string | number;
}

export default function PartyView() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;
  
  const [party, setParty] = useState<PartyData | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [predictions, setPredictions] = useState<PredictionMap>({});
  const [guestId, setGuestId] = useState<string | null>(null);
  const [guestName, setGuestName] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'predictions' | 'leaderboard'>('predictions');
  const [submitting, setSubmitting] = useState<string | null>(null);

  const fetchParty = useCallback(async () => {
    try {
      const res = await fetch(`/api/party/${code}`);
      if (res.ok) {
        const data = await res.json();
        setParty(data);
      }
    } catch (err) {
      console.error('Failed to fetch party:', err);
    }
  }, [code]);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const res = await fetch(`/api/party/${code}/leaderboard`);
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(data.leaderboard);
      }
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
    }
  }, [code]);

  useEffect(() => {
    // Get guest info from localStorage
    const storedGuestId = localStorage.getItem('guestId');
    const storedGuestName = localStorage.getItem('guestName');
    const isHost = localStorage.getItem('isHost') === 'true';
    
    if (!storedGuestId) {
      router.push(`/join?code=${code}`);
      return;
    }
    
    // If host, redirect to host view
    if (isHost) {
      router.push(`/party/${code}/host`);
      return;
    }
    
    setGuestId(storedGuestId);
    setGuestName(storedGuestName);
    
    fetchParty();
    fetchLeaderboard();
    
    // Poll for updates every 5 seconds
    const interval = setInterval(() => {
      fetchParty();
      fetchLeaderboard();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [code, router, fetchParty, fetchLeaderboard]);

  const submitPrediction = async (gameId: string, answer: string | number) => {
    if (!guestId) return;
    
    setSubmitting(gameId);
    try {
      const res = await fetch(`/api/party/${code}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-guest-id': guestId,
        },
        body: JSON.stringify({ gameId, answer }),
      });
      
      if (res.ok) {
        setPredictions(prev => ({ ...prev, [gameId]: answer }));
      }
    } catch (err) {
      console.error('Failed to submit prediction:', err);
    } finally {
      setSubmitting(null);
    }
  };

  if (!party) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading party...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-4 pb-24">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-white">{party.name}</h1>
        <p className="text-blue-300">
          Playing as <span className="font-semibold text-white">{guestName}</span>
        </p>
        {party.isLocked && (
          <span className="inline-block mt-2 bg-red-500/20 text-red-300 px-3 py-1 rounded-full text-sm">
            🔒 Predictions Locked
          </span>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 max-w-lg mx-auto">
        <button
          onClick={() => setActiveTab('predictions')}
          className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${
            activeTab === 'predictions'
              ? 'bg-white text-slate-900'
              : 'bg-white/10 text-white hover:bg-white/20'
          }`}
        >
          🎯 Predictions
        </button>
        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${
            activeTab === 'leaderboard'
              ? 'bg-white text-slate-900'
              : 'bg-white/10 text-white hover:bg-white/20'
          }`}
        >
          🏆 Leaderboard
        </button>
      </div>

      {/* Predictions Tab */}
      {activeTab === 'predictions' && (
        <div className="max-w-lg mx-auto space-y-4">
          {party.games.length === 0 ? (
            <div className="bg-white/10 rounded-xl p-8 text-center">
              <p className="text-blue-200">
                No predictions yet. Wait for the host to add some!
              </p>
            </div>
          ) : (
            party.games.map((game) => (
              <PredictionCard
                key={game.id}
                game={game}
                prediction={predictions[game.id]}
                isLocked={party.isLocked}
                isSubmitting={submitting === game.id}
                onSubmit={(answer) => submitPrediction(game.id, answer)}
              />
            ))
          )}
        </div>
      )}

      {/* Leaderboard Tab */}
      {activeTab === 'leaderboard' && (
        <div className="max-w-lg mx-auto">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl overflow-hidden">
            {leaderboard.length === 0 ? (
              <div className="p-8 text-center text-blue-200">
                No scores yet. Make some predictions!
              </div>
            ) : (
              <div className="divide-y divide-white/10">
                {leaderboard.map((entry, index) => (
                  <div
                    key={entry.guestId}
                    className={`flex items-center justify-between p-4 ${
                      entry.guestId === guestId ? 'bg-white/10' : ''
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-2xl font-bold text-white w-8">
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}`}
                      </span>
                      <span className="text-white font-medium">
                        {entry.guestName}
                        {entry.guestId === guestId && ' (you)'}
                      </span>
                    </div>
                    <span className="text-xl font-bold text-blue-300">
                      {entry.totalPoints} pts
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

// Prediction Card Component
function PredictionCard({
  game,
  prediction,
  isLocked,
  isSubmitting,
  onSubmit,
}: {
  game: Game;
  prediction?: string | number;
  isLocked: boolean;
  isSubmitting: boolean;
  onSubmit: (answer: string | number) => void;
}) {
  const [localValue, setLocalValue] = useState<string>(
    prediction !== undefined ? String(prediction) : ''
  );

  const isScored = game.isScored;
  const canSubmit = !isLocked && !isScored;

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4">
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-white font-semibold flex-1">{game.question}</h3>
        <span className="text-blue-300 text-sm ml-2">{game.points} pt{game.points !== 1 ? 's' : ''}</span>
      </div>

      {/* Pick One */}
      {game.type === 'pick-one' && game.options && (
        <div className="grid grid-cols-2 gap-2">
          {game.options.map((option) => {
            const isSelected = localValue === option;
            const isCorrect = isScored && game.correctAnswer === option;
            const isWrong = isScored && isSelected && game.correctAnswer !== option;
            
            return (
              <button
                key={option}
                onClick={() => {
                  if (canSubmit) {
                    setLocalValue(option);
                    onSubmit(option);
                  }
                }}
                disabled={!canSubmit || isSubmitting}
                className={`py-3 px-4 rounded-lg font-medium transition-all ${
                  isCorrect
                    ? 'bg-green-500 text-white'
                    : isWrong
                    ? 'bg-red-500 text-white'
                    : isSelected
                    ? 'bg-blue-500 text-white'
                    : 'bg-white/20 text-white hover:bg-white/30'
                } ${!canSubmit ? 'cursor-not-allowed' : ''}`}
              >
                {option}
              </button>
            );
          })}
        </div>
      )}

      {/* Over/Under */}
      {game.type === 'over-under' && (
        <div className="grid grid-cols-2 gap-2">
          {['Over', 'Under'].map((choice) => {
            const isSelected = localValue === choice;
            const isCorrect = isScored && game.correctAnswer === choice;
            const isWrong = isScored && isSelected && game.correctAnswer !== choice;
            
            return (
              <button
                key={choice}
                onClick={() => {
                  if (canSubmit) {
                    setLocalValue(choice);
                    onSubmit(choice);
                  }
                }}
                disabled={!canSubmit || isSubmitting}
                className={`py-3 px-4 rounded-lg font-medium transition-all ${
                  isCorrect
                    ? 'bg-green-500 text-white'
                    : isWrong
                    ? 'bg-red-500 text-white'
                    : isSelected
                    ? 'bg-blue-500 text-white'
                    : 'bg-white/20 text-white hover:bg-white/30'
                } ${!canSubmit ? 'cursor-not-allowed' : ''}`}
              >
                {choice} {game.overUnderValue}
              </button>
            );
          })}
        </div>
      )}

      {/* Exact Number */}
      {game.type === 'exact-number' && (
        <div className="flex gap-2">
          <input
            type="number"
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            disabled={!canSubmit}
            className="flex-1 bg-white/20 text-white py-3 px-4 rounded-lg border border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50"
            placeholder="Enter your prediction"
          />
          <button
            onClick={() => onSubmit(Number(localValue))}
            disabled={!canSubmit || isSubmitting || !localValue}
            className="bg-blue-500 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? '...' : 'Submit'}
          </button>
        </div>
      )}

      {/* Show result if scored */}
      {isScored && (
        <div className="mt-3 text-sm">
          <span className="text-green-400">
            ✓ Answer: {game.correctAnswer}
          </span>
        </div>
      )}
    </div>
  );
}
