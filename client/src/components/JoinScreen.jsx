import React, { useState } from 'react';

export default function JoinScreen({ onCreate, onJoin }) {
  const [mode, setMode] = useState('create');
  const [name, setName] = useState('');
  const [sessionCode, setSessionCode] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (mode === 'create') onCreate(name.trim());
    else if (sessionCode.trim()) onJoin(name.trim(), sessionCode.trim().toUpperCase());
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-2xl shadow-2xl p-4 md:p-8 w-full max-w-md border border-gray-700">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🎲 Guessing Game</h1>
          <p className="text-gray-400">Live multiplayer challenge</p>
        </div>

        <div className="flex gap-2 mb-6 bg-gray-700 rounded-lg p-1">
          <button
            onClick={() => setMode('create')}
            className={`flex-1 py-2 rounded-md transition ${
              mode === 'create' ? 'bg-purple-600 text-white' : 'text-gray-300 hover:text-white'
            }`}
          >
            Create Game
          </button>
          <button
            onClick={() => setMode('join')}
            className={`flex-1 py-2 rounded-md transition ${
              mode === 'join' ? 'bg-purple-600 text-white' : 'text-gray-300 hover:text-white'
            }`}
          >
            Join Game
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-3 mb-4 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
            autoFocus
          />
          {mode === 'join' && (
            <input
              type="text"
              placeholder="Session code"
              value={sessionCode}
              onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
              className="w-full p-3 mb-4 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
              maxLength={6}
            />
          )}
          <button
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg transition"
          >
            {mode === 'create' ? '🚀 Create Session' : '🔗 Join Session'}
          </button>
        </form>
      </div>
    </div>
  );
}