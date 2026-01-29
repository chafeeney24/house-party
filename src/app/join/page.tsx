'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function JoinPartyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const codeFromUrl = searchParams.get('code') || '';
  
  const [code, setCode] = useState(codeFromUrl);
  const [guestName, setGuestName] = useState('');
  const [partyName, setPartyName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isValidCode, setIsValidCode] = useState(false);

  // Validate code when it changes
  useEffect(() => {
    const validateCode = async () => {
      if (code.length < 5) {
        setIsValidCode(false);
        setPartyName('');
        return;
      }

      try {
        const res = await fetch(`/api/party/${code}`);
        if (res.ok) {
          const data = await res.json();
          setPartyName(data.name);
          setIsValidCode(true);
          setError('');
        } else {
          setIsValidCode(false);
          setPartyName('');
        }
      } catch {
        setIsValidCode(false);
        setPartyName('');
      }
    };

    validateCode();
  }, [code]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/party/${code}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guestName }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to join party');
      }

      const data = await res.json();
      
      // Store guest info in localStorage
      localStorage.setItem('guestId', data.guest.id);
      localStorage.setItem('guestName', data.guest.name);
      localStorage.setItem('isHost', 'false');
      
      // Redirect to party view
      router.push(`/party/${code}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join party');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <button
          onClick={() => router.push('/')}
          className="text-purple-300 hover:text-white mb-8 flex items-center gap-2"
        >
          ← Back
        </button>

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8">
          <h1 className="text-3xl font-bold text-white mb-6 text-center">
            🎟️ Join a Party
          </h1>

          <form onSubmit={handleJoin} className="space-y-6">
            <div>
              <label className="block text-purple-200 mb-2 font-medium">
                Party Code
              </label>
              <input
                type="text"
                placeholder="ABCDE"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="w-full bg-white/20 text-white placeholder-white/50 font-mono text-xl text-center tracking-widest py-3 px-4 rounded-lg border border-white/30 focus:outline-none focus:ring-2 focus:ring-pink-500"
                maxLength={6}
                required
              />
              {partyName && (
                <p className="text-green-400 text-sm mt-2 text-center">
                  ✓ Joining: {partyName}
                </p>
              )}
            </div>

            <div>
              <label className="block text-purple-200 mb-2 font-medium">
                Your Name
              </label>
              <input
                type="text"
                placeholder="Enter your name"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="w-full bg-white/20 text-white placeholder-white/50 py-3 px-4 rounded-lg border border-white/30 focus:outline-none focus:ring-2 focus:ring-pink-500"
                required
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={isLoading || !isValidCode || !guestName}
              className="w-full bg-gradient-to-r from-green-500 to-teal-500 text-white font-bold py-4 px-8 rounded-xl text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all disabled:opacity-50 disabled:transform-none disabled:cursor-not-allowed"
            >
              {isLoading ? 'Joining...' : 'Join Party'}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

export default function JoinParty() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </main>
    }>
      <JoinPartyForm />
    </Suspense>
  );
}
