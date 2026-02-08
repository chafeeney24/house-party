'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Game, GameType, LeaderboardEntry } from '@/types';
import QRCodeDisplay from '@/components/QRCodeDisplay';
import SquaresGrid from '@/components/SquaresGrid';

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
  const [activeTab, setActiveTab] = useState<'manage' | 'guests' | 'leaderboard' | 'squares'>('manage');
  const [showAddPrediction, setShowAddPrediction] = useState(false);
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [loadingTemplate, setLoadingTemplate] = useState(false);

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
    const storedGuestId = localStorage.getItem(`guestId_${code.toUpperCase()}`);
    const isHost = localStorage.getItem(`isHost_${code.toUpperCase()}`) === 'true';
    
    if (!storedGuestId || !isHost) {
      router.push(`/party/${code}`);
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

  const addPrediction = async (gameData: { type: GameType; question: string; options?: string[]; overUnderValue?: number; points?: number }) => {
    try {
      const res = await fetch(`/api/party/${code}/games`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gameData),
      });
      
      if (res.ok) {
        fetchParty();
        setShowAddPrediction(false);
      }
    } catch (err) {
      console.error('Failed to add prediction:', err);
    }
  };

  const updatePrediction = async (gameId: string, gameData: { question?: string; options?: string[]; overUnderValue?: number; points?: number }) => {
    if (!guestId) return;
    
    try {
      const res = await fetch(`/api/party/${code}/games/${gameId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-guest-id': guestId,
        },
        body: JSON.stringify(gameData),
      });
      
      if (res.ok) {
        fetchParty();
        setEditingGame(null);
      }
    } catch (err) {
      console.error('Failed to update prediction:', err);
    }
  };

  const deletePrediction = async (gameId: string) => {
    if (!guestId) return;
    
    if (!confirm('Are you sure you want to delete this prediction? All submitted answers will be lost.')) {
      return;
    }
    
    try {
      const res = await fetch(`/api/party/${code}/games/${gameId}`, {
        method: 'DELETE',
        headers: {
          'x-guest-id': guestId,
        },
      });
      
      if (res.ok) {
        fetchParty();
        fetchLeaderboard();
      }
    } catch (err) {
      console.error('Failed to delete prediction:', err);
    }
  };

  const loadTemplate = async (templateName: string) => {
    if (!guestId) return;
    
    if (!confirm(`This will add Super Bowl predictions to your party. Continue?`)) {
      return;
    }
    
    setLoadingTemplate(true);
    try {
      const res = await fetch(`/api/party/${code}/template`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-guest-id': guestId,
        },
        body: JSON.stringify({ template: templateName }),
      });
      
      if (res.ok) {
        const data = await res.json();
        alert(`Added ${data.added} predictions!`);
        fetchParty();
      }
    } catch (err) {
      console.error('Failed to load template:', err);
    } finally {
      setLoadingTemplate(false);
    }
  };

  const removeGuest = async (guestIdToRemove: string, guestName: string) => {
    if (!guestId) return;

    if (!confirm(`Remove "${guestName}" from the party? Their predictions and square claims will be deleted.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/party/${code}/guests/${guestIdToRemove}`, {
        method: 'DELETE',
        headers: {
          'x-guest-id': guestId,
        },
      });

      if (res.ok) {
        fetchParty();
        fetchLeaderboard();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to remove guest');
      }
    } catch (err) {
      console.error('Failed to remove guest:', err);
    }
  };

  const reorderGame = async (gameId: string, direction: 'up' | 'down') => {
    if (!party || !guestId) return;

    const games = [...party.games];
    const index = games.findIndex(g => g.id === gameId);
    if (index === -1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= games.length) return;

    // Swap
    [games[index], games[newIndex]] = [games[newIndex], games[index]];
    const gameIds = games.map(g => g.id);

    // Optimistic update
    setParty({ ...party, games });

    try {
      const res = await fetch(`/api/party/${code}/games`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-guest-id': guestId,
        },
        body: JSON.stringify({ gameIds }),
      });

      if (!res.ok) {
        // Revert on failure
        fetchParty();
      }
    } catch (err) {
      console.error('Failed to reorder games:', err);
      fetchParty();
    }
  };

  const scorePrediction = async (gameId: string, correctAnswer: string | number) => {
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
      console.error('Failed to score prediction:', err);
    }
  };

  if (!party) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-[#0B162A] via-[#0f1f3a] to-[#0B162A] flex items-center justify-center">
        <div className="text-white text-xl">Loading party...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0B162A] via-[#0f1f3a] to-[#0B162A] p-4 pb-24">
      {/* Header */}
      <div className="text-center mb-4">
        <h1 className="text-2xl font-bold text-white">{party.name}</h1>
        
        {/* Party Code + QR Code */}
        <div className="flex items-center justify-center gap-4 mt-3">
          <div className="flex flex-col items-center">
            <span className="bg-white/20 text-white font-mono text-lg px-4 py-1 rounded-lg tracking-widest">
              {party.code}
            </span>
            <button
              onClick={() => navigator.clipboard.writeText(`${window.location.origin}/join?code=${party.code}`)}
              className="text-orange-300 hover:text-white text-sm mt-1"
            >
              📋 Copy Link
            </button>
          </div>
          <QRCodeDisplay partyCode={party.code} />
        </div>
        
        <p className="text-orange-300 mt-2">
          {party.guests.length} player{party.guests.length !== 1 ? 's' : ''} joined
        </p>
        {/* Switch to Player View */}
        <button
          onClick={() => router.push(`/party/${code}/play`)}
          className="mt-3 text-sm bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors"
        >
          🎮 Switch to Player View
        </button>
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
          className={`flex-1 py-3 rounded-lg font-semibold transition-colors text-sm ${
            activeTab === 'manage'
              ? 'bg-white text-slate-900'
              : 'bg-white/10 text-white hover:bg-white/20'
          }`}
        >
          ⚙️ Predictions
        </button>
        <button
          onClick={() => setActiveTab('guests')}
          className={`flex-1 py-3 rounded-lg font-semibold transition-colors text-sm ${
            activeTab === 'guests'
              ? 'bg-white text-slate-900'
              : 'bg-white/10 text-white hover:bg-white/20'
          }`}
        >
          👥 Guests
        </button>
        <button
          onClick={() => setActiveTab('squares')}
          className={`flex-1 py-3 rounded-lg font-semibold transition-colors text-sm ${
            activeTab === 'squares'
              ? 'bg-white text-slate-900'
              : 'bg-white/10 text-white hover:bg-white/20'
          }`}
        >
          🏈 Squares
        </button>
        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`flex-1 py-3 rounded-lg font-semibold transition-colors text-sm ${
            activeTab === 'leaderboard'
              ? 'bg-white text-slate-900'
              : 'bg-white/10 text-white hover:bg-white/20'
          }`}
        >
          🏆 Board
        </button>
      </div>

      {/* Manage Tab */}
      {activeTab === 'manage' && (
        <div className="max-w-lg mx-auto space-y-4">
          {/* Add Prediction Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => setShowAddPrediction(true)}
              className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold py-4 px-4 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
            >
              + Add Prediction
            </button>
            <button
              onClick={() => loadTemplate('super-bowl')}
              disabled={loadingTemplate}
              className="flex-1 bg-gradient-to-r from-emerald-500 to-green-500 text-white font-bold py-4 px-4 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all disabled:opacity-50"
            >
              {loadingTemplate ? 'Loading...' : '🏈 Super Bowl Template'}
            </button>
          </div>

          {/* Predictions List */}
          {party.games.map((game, index) => (
            <HostPredictionCard
              key={game.id}
              game={game}
              index={index}
              totalGames={party.games.length}
              onScore={scorePrediction}
              onEdit={() => setEditingGame(game)}
              onDelete={() => deletePrediction(game.id)}
              onMoveUp={() => reorderGame(game.id, 'up')}
              onMoveDown={() => reorderGame(game.id, 'down')}
            />
          ))}

          {party.games.length === 0 && (
            <div className="bg-white/10 rounded-xl p-8 text-center">
              <p className="text-white/60">
                No predictions yet. Add your first one!
              </p>
            </div>
          )}
        </div>
      )}

      {/* Guests Tab */}
      {activeTab === 'guests' && (
        <div className="max-w-lg mx-auto space-y-3">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl overflow-hidden">
            <div className="p-4 border-b border-white/10">
              <h3 className="text-white font-semibold">
                {party.guests.length} Guest{party.guests.length !== 1 ? 's' : ''}
              </h3>
              <p className="text-white/40 text-sm mt-1">
                Remove duplicate or accidental entries
              </p>
            </div>
            <div className="divide-y divide-white/10">
              {party.guests.map((guest) => (
                <div
                  key={guest.id}
                  className="flex items-center justify-between p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white font-bold text-sm">
                      {guest.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span className="text-white font-medium">{guest.name}</span>
                      {guest.isHost && (
                        <span className="ml-2 text-xs bg-orange-500/20 text-orange-300 px-2 py-0.5 rounded-full">
                          Host
                        </span>
                      )}
                    </div>
                  </div>
                  {!guest.isHost && (
                    <button
                      onClick={() => removeGuest(guest.id, guest.name)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Squares Tab */}
      {activeTab === 'squares' && guestId && (
        <SquaresGrid partyCode={code} guestId={guestId} isHost={true} />
      )}

      {/* Leaderboard Tab */}
      {activeTab === 'leaderboard' && (
        <div className="max-w-lg mx-auto">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl overflow-hidden">
            {leaderboard.length === 0 ? (
              <div className="p-8 text-center text-white/60">
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
                    <span className="text-xl font-bold text-orange-300">
                      {entry.totalPoints} pts
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Prediction Modal */}
      {showAddPrediction && (
        <PredictionModal
          onClose={() => setShowAddPrediction(false)}
          onSave={(data) => {
            if (data.type) {
              addPrediction(data as { type: GameType; question: string; options?: string[]; overUnderValue?: number; points?: number });
            }
          }}
        />
      )}

      {/* Edit Prediction Modal */}
      {editingGame && (
        <PredictionModal
          game={editingGame}
          onClose={() => setEditingGame(null)}
          onSave={(data) => updatePrediction(editingGame.id, data)}
        />
      )}
    </main>
  );
}

// Host Prediction Card Component
function HostPredictionCard({
  game,
  index,
  totalGames,
  onScore,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
}: {
  game: Game;
  index: number;
  totalGames: number;
  onScore: (gameId: string, answer: string | number) => void;
  onEdit: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [questionText, hintText] = game.question.split('\n');

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4">
      <div className="flex gap-2 items-start">
        {/* Reorder buttons */}
        {!game.isScored && totalGames > 1 && (
          <div className="flex flex-col gap-1 pt-0.5">
            <button
              onClick={onMoveUp}
              disabled={index === 0}
              className="text-white/40 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed p-0.5 leading-none text-sm"
              title="Move up"
            >
              ▲
            </button>
            <button
              onClick={onMoveDown}
              disabled={index === totalGames - 1}
              className="text-white/40 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed p-0.5 leading-none text-sm"
              title="Move down"
            >
              ▼
            </button>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start mb-1">
            <h3 className="text-white font-semibold flex-1">{questionText}</h3>
            <div className="flex items-center gap-2 ml-2">
              <span className="text-orange-300 text-sm whitespace-nowrap">{game.points} pt{game.points !== 1 ? 's' : ''}</span>
              {!game.isScored && (
                <>
                  <button
                    onClick={onEdit}
                    className="text-orange-400 hover:text-orange-300 p-1"
                    title="Edit"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={onDelete}
                    className="text-red-400 hover:text-red-300 p-1"
                    title="Delete"
                  >
                    🗑️
                  </button>
                </>
              )}
            </div>
          </div>
          {hintText && (
            <p className="text-white/40 text-xs italic mb-2 leading-snug">{hintText}</p>
          )}
          {!hintText && <div className="mb-1" />}

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
                          ? 'bg-blue-500 text-white'
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
                  className="w-full bg-white/20 text-white py-2 px-4 rounded-lg border border-white/30 focus:outline-none focus:ring-2 focus:ring-orange-400"
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
                Score This Prediction
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Prediction Modal Component (Add/Edit)
function PredictionModal({
  game,
  onClose,
  onSave,
}: {
  game?: Game;
  onClose: () => void;
  onSave: (gameData: { type?: GameType; question: string; options?: string[]; overUnderValue?: number; points?: number }) => void;
}) {
  const isEditing = !!game;
  const [existingQuestion, existingHint] = (game?.question || '').split('\n');
  const [type, setType] = useState<GameType>(game?.type || 'pick-one');
  const [question, setQuestion] = useState(existingQuestion || '');
  const [hint, setHint] = useState(existingHint || '');
  const [options, setOptions] = useState<string[]>(game?.options || ['', '']);
  const [overUnderValue, setOverUnderValue] = useState(game?.overUnderValue?.toString() || '');
  const [points, setPoints] = useState(game?.points?.toString() || '1');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Combine question and hint with newline separator
    const fullQuestion = hint.trim() ? `${question}\n${hint.trim()}` : question;

    const gameData: { type?: GameType; question: string; options?: string[]; overUnderValue?: number; points?: number } = {
      question: fullQuestion,
      points: Number(points) || 1,
    };

    // Only include type for new games
    if (!isEditing) {
      gameData.type = type;
    }

    if (type === 'pick-one') {
      gameData.options = options.filter(o => o.trim());
    } else if (type === 'over-under') {
      gameData.overUnderValue = Number(overUnderValue);
    }

    onSave(gameData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-[#0B162A] rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto border border-orange-500/30">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">
            {isEditing ? 'Edit Prediction' : 'Add New Prediction'}
          </h2>
          <button onClick={onClose} className="text-orange-300 hover:text-white text-2xl">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Prediction Type - only show for new */}
          {!isEditing && (
            <div>
              <label className="block text-white/60 mb-2 text-sm">Prediction Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as GameType)}
                className="w-full bg-white/20 text-white py-3 px-4 rounded-lg border border-white/30 focus:outline-none focus:ring-2 focus:ring-orange-400"
              >
                <option value="pick-one">Pick One (Multiple Choice)</option>
                <option value="over-under">Over/Under</option>
                <option value="exact-number">Exact Number</option>
              </select>
            </div>
          )}

          {/* Question */}
          <div>
            <label className="block text-white/60 mb-2 text-sm">Question</label>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="w-full bg-white/20 text-white py-3 px-4 rounded-lg border border-white/30 focus:outline-none focus:ring-2 focus:ring-orange-400"
              placeholder="e.g., Who will win the coin toss?"
              required
            />
          </div>

          {/* Hint / Fun Fact */}
          <div>
            <label className="block text-white/60 mb-2 text-sm">Hint / Fun Fact <span className="text-white/30">(optional)</span></label>
            <input
              type="text"
              value={hint}
              onChange={(e) => setHint(e.target.value)}
              className="w-full bg-white/20 text-white/70 py-3 px-4 rounded-lg border border-white/30 focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm italic"
              placeholder="e.g., Tails leads all-time 31-28"
            />
          </div>

          {/* Options for Pick One */}
          {type === 'pick-one' && (
            <div>
              <label className="block text-white/60 mb-2 text-sm">Options</label>
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
                    className="flex-1 bg-white/20 text-white py-2 px-4 rounded-lg border border-white/30 focus:outline-none focus:ring-2 focus:ring-orange-400"
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
                className="text-orange-400 hover:text-orange-300 text-sm"
              >
                + Add Option
              </button>
            </div>
          )}

          {/* Value for Over/Under */}
          {type === 'over-under' && (
            <div>
              <label className="block text-white/60 mb-2 text-sm">Over/Under Value</label>
              <input
                type="number"
                value={overUnderValue}
                onChange={(e) => setOverUnderValue(e.target.value)}
                className="w-full bg-white/20 text-white py-3 px-4 rounded-lg border border-white/30 focus:outline-none focus:ring-2 focus:ring-orange-400"
                placeholder="e.g., 48.5"
                step="0.5"
                required={type === 'over-under'}
              />
            </div>
          )}

          {/* Points */}
          <div>
            <label className="block text-white/60 mb-2 text-sm">Points</label>
            <input
              type="number"
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              className="w-full bg-white/20 text-white py-3 px-4 rounded-lg border border-white/30 focus:outline-none focus:ring-2 focus:ring-orange-400"
              min="1"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold py-3 rounded-xl hover:shadow-lg transition-all"
          >
            {isEditing ? 'Save Changes' : 'Add Prediction'}
          </button>
        </form>
      </div>
    </div>
  );
}
