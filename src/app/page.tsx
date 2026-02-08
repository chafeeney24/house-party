'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState('');

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0B162A] via-[#0f1f3a] to-[#0B162A] flex flex-col items-center justify-center p-4">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold text-white mb-2">
          🎉 House Party
        </h1>
        <p className="text-orange-300/80 text-sm font-semibold uppercase tracking-widest mb-2">
          Super Bowl LX
        </p>
        <p className="text-lg text-white/60">
          Real-time predictions &amp; squares for game day
        </p>
      </div>

      <div className="w-full max-w-md space-y-6">
        {/* Host a Party */}
        <button
          onClick={() => router.push('/create')}
          className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold py-4 px-8 rounded-xl text-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all"
        >
          🎤 Host a Party
        </button>

        {/* Join a Party */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h2 className="text-white font-semibold mb-4 text-center">
            Join a Party
          </h2>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Enter code"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              className="flex-1 bg-white/10 text-white placeholder-white/30 font-mono text-xl text-center tracking-widest py-3 px-4 rounded-lg border border-white/10 focus:outline-none focus:ring-2 focus:ring-orange-400"
              maxLength={6}
            />
            <button
              onClick={() => joinCode && router.push(`/join?code=${joinCode}`)}
              disabled={!joinCode}
              className="bg-white text-[#0B162A] font-bold py-3 px-6 rounded-lg hover:bg-orange-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Join
            </button>
          </div>
        </div>
      </div>

      <footer className="absolute bottom-8 text-white/30 text-sm">
        Seahawks vs Patriots &middot; Feb 8, 2026
      </footer>
    </main>
  );
}
