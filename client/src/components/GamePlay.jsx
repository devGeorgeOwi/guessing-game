import React, { useState } from 'react';

export default function GamePlay({ gameState, players, playerId, onSubmitGuess, onLeave }) {
  const [guess, setGuess] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!guess.trim()) return;
    onSubmitGuess(guess.trim());
    setGuess('');
  };

  const isGameOver = gameState?.winnerId || gameState?.expired;
  const isWinner = gameState?.winnerId === playerId;
  const showAnswer = gameState?.answerRevealed;

  return (
    <div className="min-h-screen bg-gray-900 p-3 md:p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">🎯 Guessing Game</h1>
          <button onClick={onLeave} className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-white text-sm">
            Leave
          </button>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 mb-6 text-center">
          <div className="text-4xl font-mono font-bold text-purple-400 mb-4">{gameState?.timeLeft}s</div>
          <div className="w-full bg-gray-700 rounded-full h-2 mb-6">
            <div
              className="bg-purple-600 h-2 rounded-full transition-all duration-1000"
              style={{ width: `${((gameState?.timeLeft ?? 0) / (gameState?.timeLimit ?? 1)) * 100}%` }}
            />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Question:</h2>
          <p className="text-xl text-gray-300">{gameState?.question}</p>
        </div>

        {!isGameOver && (
          <form onSubmit={handleSubmit} className="bg-gray-800 rounded-xl p-6">
            <input
              type="text"
              placeholder="Your guess..."
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              className="w-full p-4 bg-gray-700 border border-gray-600 rounded-lg text-white text-lg placeholder-gray-400 mb-4"
              autoFocus
            />
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-lg font-bold text-white transition">
              Submit Guess
            </button>
            <p className="text-gray-500 text-sm text-center mt-3">You have 3 attempts</p>
          </form>
        )}

        {isGameOver && (
          <div className="bg-gray-800 rounded-xl p-6 text-center">
            {isWinner && <div className="text-green-400 text-2xl font-bold mb-2">🎉 YOU WON! +10 points 🎉</div>}
            {!isWinner && gameState?.winnerId && (
              <div className="text-yellow-400 text-xl mb-2">
                {players.find(p => p.id === gameState.winnerId)?.name} won the round!
              </div>
            )}
            {gameState?.expired && <div className="text-red-400 text-xl mb-2">⏰ Time's up! No one guessed correctly.</div>}
            {showAnswer && (
              <div className="bg-gray-700 p-4 rounded-lg mt-4">
                <p className="text-gray-300">The answer was:</p>
                <p className="text-2xl font-bold text-purple-400">{gameState?.revealedAnswer}</p>
              </div>
            )}
            <p className="text-gray-400 mt-4">Moving to next round...</p>
          </div>
        )}
      </div>
    </div>
  );
}