import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import toast, { Toaster } from 'react-hot-toast';
import JoinScreen from './components/JoinScreen';
import GameLobby from './components/GameLobby';
import GamePlay from './components/GamePlay';
import Scoreboard from './components/Scoreboard';
import GameLog from './components/GameLog';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

export default function App() {
  const [step, setStep] = useState('join'); // join, lobby, play
  const [socket, setSocket] = useState(null);
  const [sessionId, setSessionId] = useState('');
  const [playerId, setPlayerId] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [isGameMaster, setIsGameMaster] = useState(false);
  const [players, setPlayers] = useState([]);
  const [gameState, setGameState] = useState(null);
  const [gameLogs, setGameLogs] = useState([]);
  const timerRef = useRef(null);

  const addLog = (message) => {
    setGameLogs(prev => [...prev, { 
      time: new Date().toLocaleTimeString(), 
      message 
    }]);
  };

  useEffect(() => {
    const newSocket = io(SOCKET_URL, {
      transports: ['polling', 'websocket'],  // polling first,  then upgrade to websocket
      upgrade: true,
      reconnectionAttempts:  5,
      reconnectionDelay: 1000
    });
    setSocket(newSocket);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on('players:update', (updatedPlayers) => {
      setPlayers(updatedPlayers);
      const me = updatedPlayers.find(p => p.id === playerId);
      setIsGameMaster(me?.isGameMaster || false);
    });

    socket.on('game:started', ({ question, timeLimit, startedAt }) => {
      setStep('play');
      const endTime = startedAt + timeLimit * 1000;
      setGameState({
        question,
        timeLimit,
        timeLeft: timeLimit,
        endTime,
        answerRevealed: false,
        winnerId: null,
        expired: false
      });
      addLog(`🎮 Game started! Question: "${question}"`); // ✅ Add to Game Log
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
        setGameState(prev => ({ ...prev, timeLeft: remaining }));
        if (remaining <= 0 && timerRef.current) clearInterval(timerRef.current);
      }, 1000);
    });

    socket.on('game:expired', ({ answer, message }) => {
      toast.error(message);
      addLog(`⏰ Game expired! Answer: "${answer}"`); // ✅ Add to Game Log
      setGameState(prev => ({ ...prev, answerRevealed: true, revealedAnswer: answer, expired: true }));
      setTimeout(() => {
        setStep('lobby');
        setGameState(null);
        if (timerRef.current) clearInterval(timerRef.current);
      }, 3000);
    });

    socket.on('game:winner', ({ winnerId, winnerName, answer, pointsAwarded }) => {
      toast.success(`${winnerName} won! +${pointsAwarded} points`);
      addLog(`🏆 ${winnerName} won the round with answer "${answer}" and earned +${pointsAwarded} points!`); // ✅ Add to Game Log
      setGameState(prev => ({ ...prev, winnerId, answerRevealed: true, revealedAnswer: answer, expired: false }));
      if (timerRef.current) clearInterval(timerRef.current);
    });

    socket.on('game:ended', () => {
      addLog(`🔚 Round ended. Returning to lobby...`);
      setTimeout(() => {
        setStep('lobby');
        setGameState(null);
      }, 3000);
    });

    socket.on('game:newGameMaster', ({ gameMasterId }) => {
      if (gameMasterId === playerId) {
        toast.success('You are now the Game Master!');
        addLog(`👑 You are now the Game Master!`);
        setIsGameMaster(true);
      } else {
        const newGM = players.find(p => p.id === gameMasterId)?.name || 'Someone';
        addLog(`👑 ${newGM} is now the Game Master.`);
      }
    });

    socket.on('guess:result', ({ playerId: guesserId, playerName, attemptsLeft }) => {
      if (guesserId !== playerId) {
        toast(`${playerName} guessed wrong! ${attemptsLeft} attempts left`);
        addLog(`❌ ${playerName} guessed wrong. ${attemptsLeft} attempts remaining.`); // ✅ Add to Game Log
      }
    });

    return () => {
      socket.off('players:update');
      socket.off('game:started');
      socket.off('game:expired');
      socket.off('game:winner');
      socket.off('game:ended');
      socket.off('game:newGameMaster');
      socket.off('guess:result');
    };
  }, [socket, playerId, players]);

  const handleCreateSession = (name) => {
    socket.emit('session:create', { playerName: name }, (res) => {
      if (res.error) return toast.error(res.error);
      setSessionId(res.sessionId);
      setPlayerId(res.playerId);
      setPlayerName(name);
      setIsGameMaster(true);
      setStep('lobby');
      toast.success(`Session created! Code: ${res.sessionId}`);
      addLog(`🎉 Session created with code ${res.sessionId}. You are the Game Master.`);
    });
  };

  const handleJoinSession = (name, code) => {
    const normalizedCode = code.trim().toUpperCase();
    socket.emit('session:join', { sessionId: normalizedCode, playerName: name }, (res) => {
      if (res.error) return toast.error(res.error);
      setSessionId(normalizedCode); // ✅ Use Normalized code
      setPlayerId(res.playerId);
      setPlayerName(name);
      setIsGameMaster(false);
      setStep('lobby');
      toast.success(`Joined session ${normalizedCode}`);
      addLog(`🔗 ${name} joined the session.`);
    });
  };

  const handleStartGame = (question, answer) => {
    socket.emit('game:start', { sessionId, question, answer }, (res) => {
      if (res.error) toast.error(res.error);
      else toast.success('Game started!');
    });
  };

  const handleSubmitGuess = (guess) => {
    socket.emit('game:guess', { sessionId, guess }, (res) => {
      if (res.error) return toast.error(res.error);
      if (res.correct) toast.success(res.message);
      else toast(res.message, { icon: '❌' });
    });
  };

  const handleLeaveSession = () => {
    socket.emit('session:leave', { sessionId }, () => {
      setStep('join');
      setSessionId('');
      setPlayerId('');
      setPlayerName('');
      setIsGameMaster(false);
      setPlayers([]);
      setGameState(null);
      setGameLogs([]); // ✅ Clear Game Log
      if (timerRef.current) clearInterval(timerRef.current);
    });
  };

  if (step === 'join') {
    return (
      <>
        <Toaster position="top-center" />
        <JoinScreen onCreate={handleCreateSession} onJoin={handleJoinSession} />
      </>
    );
  }
  if (step === 'lobby') {
    return (
      <>
        <Toaster position="top-center" />
        <div className="flex flex-col lg:flex-row gap-4 p-4 md:p-6"> {/* ✅ Add Game Log */}
          <div className="flex-1 order-1 lg:order-none">
            <GameLobby
                socket={socket}
                sessionId={sessionId}
                players={players}
                isGameMaster={isGameMaster}
                // onStartGame={handleStartGame}
                onLeave={handleLeaveSession}
                playerName={playerName}
              />
            </div>
          <div className="w-full lg:w-80 order-2 lg:order-none">
            <GameLog events={gameLogs} />
          </div>
        </div>
      </>
    );
  }
  return (
    <>
      <Toaster position="top-center" />
      <div className="flex flex-col lg:flex-row gap-4 p-4 md:p-6">
        <div className="flex-1 order-1 lg:order-none">
          <GamePlay
          gameState={gameState}
          players={players}
          playerId={playerId}
          onSubmitGuess={handleSubmitGuess}
          onLeave={handleLeaveSession}
        />
        </div>
        <div className="w-full lg:w-80 order-2 lg:order-none"> {/* <-- GameLog sidebar */}
          <GameLog events={gameLogs} />
        </div>
      </div>
      <Scoreboard players={players} currentPlayerId={playerId} />
    </>
  );
}