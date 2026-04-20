import React, { useState } from 'react';
import toast from 'react-hot-toast';
import QuestionBank from './QuestionBank';

export default function GameLobby({ socket, sessionId, players, isGameMaster, onLeave, playerName }) {
  const [questions, setQuestions] = useState([]);

  const addQuestion = (q, a) => {
    setQuestions(prev => [...prev, { question: q, answer: a }]);
  };

  const removeQuestion = (idx) => {
    setQuestions(prev => prev.filter((_, i) => i !== idx));
  };

  const clearQuestions = () => setQuestions([]);

  const copyCode = () => {
    navigator.clipboard.writeText(sessionId);
    toast.success('Session code copied!');
  };

  const handleStart = () => {
    if (questions.length === 0) {
      toast.error('Add at least one question to the bank');
      return;
    }
    // Save question bank to server
    socket.emit('game:setQuestions', { sessionId, questions }, (res) => {
      if (res.error) return toast.error(res.error);
      // Then start the game
      socket.emit('game:start', { sessionId }, (res2) => {
        if (res2.error) toast.error(res2.error);
        else toast.success('Game started!');
      });
    });
  };

  return (
    <div className="min-h-screen bg-gray-900 p-3 md:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">🎮 Game Lobby</h1>
            <button onClick={copyCode} className="text-sm bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded mt-2 text-purple-300">
              📋 Code: {sessionId}
            </button>
          </div>
          <button onClick={onLeave} className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-white">
            Leave Session
          </button>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">👥 Players ({players.length}/10)</h2>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {players.map((player) => (
              <div key={player.id} className="flex justify-between items-center p-3 bg-gray-700 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-white">{player.name}</span>
                  {player.isGameMaster && <span className="text-yellow-400 text-sm">👑 GM</span>}
                  {player.id === playerName && <span className="text-gray-400 text-sm">(you)</span>}
                </div>
                <div className="text-purple-400 font-bold">{player.score} pts</div>
              </div>
            ))}
          </div>
        </div>

        {isGameMaster && (
          <>
            <div className="bg-gray-800 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4">🎯 Start Game</h2>
              <button
                onClick={handleStart}
                disabled={players.length < 2 || questions.length === 0}
                className={`w-full py-3 rounded-lg font-bold transition ${
                  players.length >= 2 && questions.length > 0
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
              >
                {players.length < 2
                  ? `Need ${2 - players.length} more player(s)`
                  : questions.length === 0
                  ? 'Add questions first'
                  : '🚀 Start Game'}
              </button>
            </div>
            <QuestionBank
              questions={questions}
              onAdd={addQuestion}
              onRemove={removeQuestion}
              onClear={clearQuestions}
            />
          </>
        )}

        {!isGameMaster && (
          <div className="bg-gray-800 rounded-xl p-6 text-center">
            <p className="text-gray-400">Waiting for Game Master to prepare questions and start...</p>
            <div className="mt-2 animate-pulse text-purple-400">⏳</div>
          </div>
        )}
      </div>
    </div>
  );
}