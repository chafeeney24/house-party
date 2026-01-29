'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState('');

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex flex-col items-center justify-center p-4">
      <div className="text-center mb-12">
        <h1 className="text-6xl font-bold text-white mb-4">
          🎉 House Party
        </h1>
        <p className="text-xl text-blue-200">
          Real-time predictions for your party games
        </p>
      </div>

      <div className="w-full max-w-md space-y-6">
        {/* Host a Party */}
        <button
          onClick={() => router.push('/create')}
          className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold py-4 px-8 rounded-xl text-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
        >
          🎤 Host a Party
        </button>

        {/* Join a Party */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
          <h2 className="text-white font-semibold mb-4 text-center">
            Join a Party
          </h2>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Enter code"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              className="flex-1 bg-white/20 text-white placeholder-white/50 font-mono text-xl text-center tracking-widest py-3 px-4 rounded-lg border border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-400"
              maxLength={6}
            />
            <button
              onClick={() => joinCode && router.push(`/join?code=${joinCode}`)}
              disabled={!joinCode}
              className="bg-white text-slate-900 font-bold py-3 px-6 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Join
            </button>
          </div>
        </div>
      </div>

      <footer className="absolute bottom-8 text-blue-300 text-sm">
        Perfect for Super Bowl parties, game nights, and more!
      </footer>
    </main>
  );
}
