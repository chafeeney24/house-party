'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateParty() {
  const router = useRouter();
  const [partyName, setPartyName] = useState('');
  const [hostName, setHostName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/party', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: partyName, hostName }),
      });

      if (!res.ok) {
        throw new Error('Failed to create party');
      }

      const data = await res.json();
      
      // Store host info in localStorage (party-specific)
      const partyCode = data.party.code;
      localStorage.setItem(`guestId_${partyCode}`, data.host.id);
      localStorage.setItem(`guestName_${partyCode}`, data.host.name);
      localStorage.setItem(`isHost_${partyCode}`, 'true');
      
      // Redirect to host dashboard
      router.push(`/party/${partyCode}/host`);
    } catch (err) {
      setError('Failed to create party. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0B162A] via-[#0f1f3a] to-[#0B162A] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <button
          onClick={() => router.push('/')}
          className="text-white/50 hover:text-white mb-8 flex items-center gap-2"
        >
          ← Back
        </button>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
          <h1 className="text-3xl font-bold text-white mb-6 text-center">
            🎤 Host a Party
          </h1>

          <form onSubmit={handleCreate} className="space-y-6">
            <div>
              <label className="block text-white/60 mb-2 font-medium">
                Party Name
              </label>
              <input
                type="text"
                placeholder="Super Bowl LX Party"
                value={partyName}
                onChange={(e) => setPartyName(e.target.value)}
                className="w-full bg-white/20 text-white placeholder-white/50 py-3 px-4 rounded-lg border border-white/30 focus:outline-none focus:ring-2 focus:ring-orange-400"
                required
              />
            </div>

            <div>
              <label className="block text-white/60 mb-2 font-medium">
                Your Name
              </label>
              <input
                type="text"
                placeholder="Enter your name"
                value={hostName}
                onChange={(e) => setHostName(e.target.value)}
                className="w-full bg-white/20 text-white placeholder-white/50 py-3 px-4 rounded-lg border border-white/30 focus:outline-none focus:ring-2 focus:ring-orange-400"
                required
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={isLoading || !partyName || !hostName}
              className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold py-4 px-8 rounded-xl text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all disabled:opacity-50 disabled:transform-none disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating...' : 'Create Party'}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
