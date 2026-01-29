'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Game, GameType, LeaderboardEntry } from '@/types';

interface PartyData {
  code: string;
  name: string;
  isLocked: boolean;
  games: Game[];
  guests: { id: string; name: string; isHost: boolean }[];
}

export default function HostDashboard() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;
  
  const [party, setParty] = useState<PartyData | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [guestId, setGuestId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'manage' | 'leaderboard'>('manage');
  const [showAddGame, setShowAddGame] = useState(false);

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
    const storedGuestId = localStorage.getItem('guestId');
    const isHost = localStorage.getItem('isHost') === 'true';
    
    if (!storedGuestId || !isHost) {
      router.push(`/join?code=${code}`);
      return;
    }
    
    setGuestId(storedGuestId);
    fetchParty();
    fetchLeaderboard();
    
    const interval = setInterval(() => {
      fetchParty();
      fetchLeaderboard();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [code, router, fetchParty, fetchLeaderboard]);

  const toggleLock = async () => {
    if (!party) return;
    
    try {
      const res = await fetch(`/api/party/${code}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isLocked: !party.isLocked }),
      });
      
      if (res.ok) {
        fetchParty();
      }
    } catch (err) {
      console.error('Failed to toggle lock:', err);
    }
  };

  const addGame = async (gameData: { type: GameType; question: string; options?: string[]; overUnderValue?: number; points?: number }) => {
    try {
      const res = await fetch(`/api/party/${code}/games`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gameData),
      });
      
      if (res.ok) {
        fetchParty();
        setShowAddGame(false);
      }
    } catch (err) {
      console.error('Failed to add game:', err);
    }
  };

  const scoreGame = async (gameId: string, correctAnswer: string | number) => {
    if (!guestId) return;
    
    try {
      const res = await fetch(`/api/party/${code}/score`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-guest-id': guestId,
        },
        body: JSON.stringify({ gameId, correctAnswer }),
      });
      
      if (res.ok) {
        fetchParty();
        fetchLeaderboard();
      }
    } catch (err) {
      console.error('Failed to score game:', err);
    }
  };

  if (!party) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading party...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 p-4 pb-24">
      {/* Header */}
      <div className="text-center mb-4">
        <h1 className="text-2xl font-bold text-white">{party.name}</h1>
        <div className="flex items-center justify-center gap-2 mt-2">
          <span className="bg-white/20 text-white font-mono text-lg px-4 py-1 rounded-lg tracking-widest">
            {party.code}
          </span>
          <button
            onClick={() => navigator.clipboard.writeText(`${window.location.origin}/join?code=${party.code}`)}
            className="text-purple-300 hover:text-white text-sm"
          >
            📋 Copy Link
          </button>
        </div>
        <p className="text-purple-300 mt-2">
          {party.guests.length} player{party.guests.length !== 1 ? 's' : ''} joined
        </p>
      </div>

      {/* Lock/Unlock */}
      <div className="max-w-lg mx-auto mb-4">
        <button
          onClick={toggleLock}
          className={`w-full py-3 rounded-lg font-semibold transition-colors ${
            party.isLocked
              ? 'bg-green-500 hover:bg-green-600 text-white'
              : 'bg-red-500 hover:bg-red-600 text-white'
          }`}
        >
          {party.isLocked ? '🔓 Unlock Predictions' : '🔒 Lock Predictions'}
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 max-w-lg mx-auto">
        <button
          onClick={() => setActiveTab('manage')}
          className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${
            activeTab === 'manage'
              ? 'bg-white text-purple-900'
              : 'bg-white/10 text-white hover:bg-white/20'
          }`}
        >
          ⚙️ Manage Games
        </button>
        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${
            activeTab === 'leaderboard'
              ? 'bg-white text-purple-900'
              : 'bg-white/10 text-white hover:bg-white/20'
          }`}
        >
          🏆 Leaderboard
        </button>
      </div>

      {/* Manage Tab */}
      {activeTab === 'manage' && (
        <div className="max-w-lg mx-auto space-y-4">
          {/* Add Game Button */}
          <button
            onClick={() => setShowAddGame(true)}
            className="w-full bg-gradient-to-r from-pink-500 to-orange-500 text-white font-bold py-4 px-8 rounded-xl text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
          >
            + Add Game
          </button>

          {/* Games List */}
          {party.games.map((game) => (
            <HostGameCard
              key={game.id}
              game={game}
              onScore={scoreGame}
            />
          ))}

          {party.games.length === 0 && (
            <div className="bg-white/10 rounded-xl p-8 text-center">
              <p className="text-purple-200">
                No games yet. Add your first prediction game!
              </p>
            </div>
          )}
        </div>
      )}

      {/* Leaderboard Tab */}
      {activeTab === 'leaderboard' && (
        <div className="max-w-lg mx-auto">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl overflow-hidden">
            {leaderboard.length === 0 ? (
              <div className="p-8 text-center text-purple-200">
                No scores yet.
              </div>
            ) : (
              <div className="divide-y divide-white/10">
                {leaderboard.map((entry, index) => (
                  <div
                    key={entry.guestId}
                    className="flex items-center justify-between p-4"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-2xl font-bold text-white w-8">
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}`}
                      </span>
                      <span className="text-white font-medium">
                        {entry.guestName}
                      </span>
                    </div>
                    <span className="text-xl font-bold text-purple-300">
                      {entry.totalPoints} pts
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Game Modal */}
      {showAddGame && (
        <AddGameModal
          onClose={() => setShowAddGame(false)}
          onAdd={addGame}
        />
      )}
    </main>
  );
}

// Host Game Card Component
function HostGameCard({
  game,
  onScore,
}: {
  game: Game;
  onScore: (gameId: string, answer: string | number) => void;
}) {
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4">
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-white font-semibold flex-1">{game.question}</h3>
        <span className="text-purple-300 text-sm ml-2">{game.points} pt{game.points !== 1 ? 's' : ''}</span>
      </div>

      {game.isScored ? (
        <div className="bg-green-500/20 text-green-300 py-2 px-4 rounded-lg">
          ✓ Scored: {game.correctAnswer}
        </div>
      ) : (
        <div className="space-y-2">
          {/* Pick One / Over-Under */}
          {(game.type === 'pick-one' || game.type === 'over-under') && (
            <div className="flex flex-wrap gap-2">
              {(game.type === 'pick-one' ? game.options! : ['Over', 'Under']).map((option) => (
                <button
                  key={option}
                  onClick={() => setSelectedAnswer(option)}
                  className={`py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                    selectedAnswer === option
                      ? 'bg-pink-500 text-white'
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  {option} {game.type === 'over-under' && game.overUnderValue}
                </button>
              ))}
            </div>
          )}

          {/* Exact Number */}
          {game.type === 'exact-number' && (
            <input
              type="number"
              value={selectedAnswer}
              onChange={(e) => setSelectedAnswer(e.target.value)}
              className="w-full bg-white/20 text-white py-2 px-4 rounded-lg border border-white/30 focus:outline-none focus:ring-2 focus:ring-pink-500"
              placeholder="Enter correct answer"
            />
          )}

          <button
            onClick={() => {
              if (selectedAnswer) {
                onScore(game.id, game.type === 'exact-number' ? Number(selectedAnswer) : selectedAnswer);
              }
            }}
            disabled={!selectedAnswer}
            className="w-full bg-green-500 text-white py-2 rounded-lg font-semibold hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Score This Game
          </button>
        </div>
      )}
    </div>
  );
}

// Add Game Modal Component
function AddGameModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (gameData: { type: GameType; question: string; options?: string[]; overUnderValue?: number; points?: number }) => void;
}) {
  const [type, setType] = useState<GameType>('pick-one');
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [overUnderValue, setOverUnderValue] = useState('');
  const [points, setPoints] = useState('1');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const gameData: { type: GameType; question: string; options?: string[]; overUnderValue?: number; points?: number } = {
      type,
      question,
      points: Number(points) || 1,
    };

    if (type === 'pick-one') {
      gameData.options = options.filter(o => o.trim());
    } else if (type === 'over-under') {
      gameData.overUnderValue = Number(overUnderValue);
    }

    onAdd(gameData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-purple-900 rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Add New Game</h2>
          <button onClick={onClose} className="text-purple-300 hover:text-white text-2xl">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Game Type */}
          <div>
            <label className="block text-purple-200 mb-2 text-sm">Game Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as GameType)}
              className="w-full bg-white/20 text-white py-3 px-4 rounded-lg border border-white/30 focus:outline-none focus:ring-2 focus:ring-pink-500"
            >
              <option value="pick-one">Pick One (Multiple Choice)</option>
              <option value="over-under">Over/Under</option>
              <option value="exact-number">Exact Number</option>
            </select>
          </div>

          {/* Question */}
          <div>
            <label className="block text-purple-200 mb-2 text-sm">Question</label>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="w-full bg-white/20 text-white py-3 px-4 rounded-lg border border-white/30 focus:outline-none focus:ring-2 focus:ring-pink-500"
              placeholder="e.g., Who will win the coin toss?"
              required
            />
          </div>

          {/* Options for Pick One */}
          {type === 'pick-one' && (
            <div>
              <label className="block text-purple-200 mb-2 text-sm">Options</label>
              {options.map((option, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...options];
                      newOptions[index] = e.target.value;
                      setOptions(newOptions);
                    }}
                    className="flex-1 bg-white/20 text-white py-2 px-4 rounded-lg border border-white/30 focus:outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder={`Option ${index + 1}`}
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => setOptions(options.filter((_, i) => i !== index))}
                      className="text-red-400 hover:text-red-300 px-2"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => setOptions([...options, ''])}
                className="text-pink-400 hover:text-pink-300 text-sm"
              >
                + Add Option
              </button>
            </div>
          )}

          {/* Value for Over/Under */}
          {type === 'over-under' && (
            <div>
              <label className="block text-purple-200 mb-2 text-sm">Over/Under Value</label>
              <input
                type="number"
                value={overUnderValue}
                onChange={(e) => setOverUnderValue(e.target.value)}
                className="w-full bg-white/20 text-white py-3 px-4 rounded-lg border border-white/30 focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="e.g., 48.5"
                step="0.5"
                required
              />
            </div>
          )}

          {/* Points */}
          <div>
            <label className="block text-purple-200 mb-2 text-sm">Points</label>
            <input
              type="number"
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              className="w-full bg-white/20 text-white py-3 px-4 rounded-lg border border-white/30 focus:outline-none focus:ring-2 focus:ring-pink-500"
              min="1"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-pink-500 to-orange-500 text-white font-bold py-3 rounded-xl hover:shadow-lg transition-all"
          >
            Add Game
          </button>
        </form>
      </div>
    </div>
  );
}
