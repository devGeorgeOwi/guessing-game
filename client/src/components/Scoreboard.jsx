import React from 'react';

export default function Scoreboard({ players, currentPlayerId }) {
  const sorted = [...players].sort((a, b) => b.score - a.score);
  return (
    <div className="bg-gray-800 rounded-xl shadow-xl overflow-hidden border border-gray-700 
                sticky top-4 z-10 mx-4 lg:fixed lg:right-4 lg:top-20 lg:w-64 lg:mx-0">
      <div className="bg-purple-600 p-3">
        <h3 className="text-white font-bold text-center">🏆 Scoreboard</h3>
      </div>
      <div className="p-3">
        {sorted.map((player, idx) => (
          <div key={player.id} className={`flex justify-between items-center p-2 rounded mb-1 ${player.id === currentPlayerId ? 'bg-purple-900/50' : ''}`}>
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-sm w-5">{idx + 1}.</span>
              <span className="text-white">
                {player.name}
                {player.id === currentPlayerId && <span className="text-purple-400 text-xs ml-1">(you)</span>}
              </span>
            </div>
            <span className="text-purple-400 font-bold">{player.score}</span>
          </div>
        ))}
        {players.length === 0 && <p className="text-gray-500 text-center text-sm">No players</p>}
      </div>
    </div>
  );
}