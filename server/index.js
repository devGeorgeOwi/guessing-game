import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { GameSessionManager } from './GameSessionManager.js';

const app = express();
const httpServer = createServer(app);

// ========== CORS: Allowed Origins ==========
const allowedOrigins = [
  'http://localhost:5173',                        // Vite dev
  'https://guessing-game-three-tau.vercel.app'    // Your live frontend
];
const envOrigin = process.env.FRONTEND_URL?.replace(/\/$/, '');
if (envOrigin) allowedOrigins.push(envOrigin);

// ========== Socket.IO Server ==========
const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      // Allow non‑browser requests (e.g., Postman) with no origin
      if (!origin) return callback(null, true);
      const cleanOrigin = origin.replace(/\/$/, '');
      if (allowedOrigins.includes(cleanOrigin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked: ${origin}`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST']
  },
  transports: ['polling', 'websocket'],   // polling first as fallback
  allowEIO3: true,                        // compatibility with older clients
  pingTimeout: 60000,
  pingInterval: 25000
});

// ========== Optional Health Check ==========
app.get('/health', (req, res) => res.send('OK'));

// ========== Session Manager ==========
const sessionManager = new GameSessionManager();

// ========== Socket.IO Event Handlers ==========
io.on('connection', (socket) => {
  console.log(`[CONNECT] ${socket.id}`);

  // Create session
  socket.on('session:create', ({ playerName }, callback) => {
    try {
      if (!playerName?.trim()) {
        return callback({ error: 'Player name required' });
      }
      const session = sessionManager.createSession(socket.id, playerName.trim());
      socket.join(session.sessionId);
      callback({ 
        success: true, 
        sessionId: session.sessionId,
        gameMasterId: session.gameMasterId,
        playerId: socket.id
      });
      io.to(session.sessionId).emit('players:update', session.getPublicPlayers());
    } catch (err) {
      callback({ error: err.message });
    }
  });

  // Join session
  socket.on('session:join', ({ sessionId, playerName }, callback) => {
    try {
      if (!sessionId?.trim() || !playerName?.trim()) {
        return callback({ error: 'Session ID and player name required' });
      }
      const session = sessionManager.getSession(sessionId.trim());
      if (!session) return callback({ error: 'Session not found' });
      
      const result = session.addPlayer(socket.id, playerName.trim());
      if (!result.success) return callback({ error: result.error });
      
      socket.join(sessionId);
      callback({ 
        success: true, 
        gameMasterId: session.gameMasterId,
        playerId: socket.id
      });
      io.to(sessionId).emit('players:update', session.getPublicPlayers());
    } catch (err) {
      callback({ error: err.message });
    }
  });

  // Set question bank (GM only)
  socket.on('game:setQuestions', ({ sessionId, questions }, callback) => {
    try {
      const session = sessionManager.getSession(sessionId);
      if (!session) return callback({ error: 'Session not found' });
      if (session.gameMasterId !== socket.id) {
        return callback({ error: 'Only game master can set questions' });
      }
      session.setQuestions(questions);
      callback({ success: true, count: session.questionQueue.length });
    } catch (err) {
      callback({ error: err.message });
    }
  });

  // Start game (GM only)
  socket.on('game:start', ({ sessionId }, callback) => {
    try {
      const session = sessionManager.getSession(sessionId);
      if (!session) return callback({ error: 'Session not found' });
      if (session.gameMasterId !== socket.id) {
        return callback({ error: 'Only game master can start' });
      }
      const result = session.startGame();
      if (!result.success) return callback({ error: result.error });
      
      io.to(sessionId).emit('game:started', {
        question: session.currentQuestion,
        timeLimit: session.timeLimit,
        startedAt: Date.now()
      });
      
      // Timer
      const timer = setTimeout(() => {
        const expiredSession = sessionManager.getSession(sessionId);
        if (expiredSession?.isGameActive && !expiredSession.winnerId) {
          expiredSession.endGame(false);
          io.to(sessionId).emit('game:expired', {
            answer: expiredSession.currentAnswer,
            message: "Time's up! No one guessed correctly."
          });
          io.to(sessionId).emit('game:ended', { nextGameMaster: expiredSession.gameMasterId, winner: null });
          io.to(sessionId).emit('players:update', expiredSession.getPublicPlayers());
        }
      }, session.timeLimit * 1000);
      
      session.setTimer(timer);
      callback({ success: true });
    } catch (err) {
      callback({ error: err.message });
    }
  });

  // Submit guess
  socket.on('game:guess', ({ sessionId, guess }, callback) => {
    try {
      const session = sessionManager.getSession(sessionId);
      if (!session) return callback({ error: 'Session not found' });
      
      const result = session.submitGuess(socket.id, guess);
      if (!result.success) return callback({ error: result.error });
      
      if (result.correct) {
        if (session.timer) clearTimeout(session.timer);
        session.endGame(true);
        
        io.to(sessionId).emit('game:winner', {
          winnerId: socket.id,
          winnerName: session.getPlayerName(socket.id),
          answer: session.currentAnswer,
          pointsAwarded: 10
        });
        io.to(sessionId).emit('game:ended', {
          nextGameMaster: session.gameMasterId,
          winner: { id: socket.id, name: session.getPlayerName(socket.id) }
        });
        io.to(sessionId).emit('players:update', session.getPublicPlayers());
        callback({ correct: true, message: 'Correct! You win!' });
      } else {
        callback({ 
          correct: false, 
          attemptsLeft: result.attemptsLeft,
          message: `Wrong! ${result.attemptsLeft} attempts left.`
        });
        io.to(sessionId).emit('guess:result', {
          playerId: socket.id,
          playerName: session.getPlayerName(socket.id),
          attemptsLeft: result.attemptsLeft
        });
      }
    } catch (err) {
      callback({ error: err.message });
    }
  });

  // Leave session
  socket.on('session:leave', ({ sessionId }, callback) => {
    try {
      const session = sessionManager.getSession(sessionId);
      if (!session) {
        return callback?.({ success: true });
      }
      const newMaster = session.removePlayer(socket.id);
      socket.leave(sessionId);
      
      if (session.getPlayerCount() === 0) {
        sessionManager.deleteSession(sessionId);
        callback?.({ success: true, sessionDeleted: true });
      } else {
        io.to(sessionId).emit('players:update', session.getPublicPlayers());
        if (newMaster) {
          io.to(sessionId).emit('game:newGameMaster', { gameMasterId: newMaster });
        }
        callback?.({ success: true });
      }
    } catch (err) {
      callback?.({ error: err.message });
    }
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log(`[DISCONNECT] ${socket.id}`);
    const sessionInfo = sessionManager.findSessionByPlayerId(socket.id);
    if (sessionInfo) {
      const { session, sessionId } = sessionInfo;
      const newMaster = session.removePlayer(socket.id);
      if (session.getPlayerCount() === 0) {
        sessionManager.deleteSession(sessionId);
      } else {
        io.to(sessionId).emit('players:update', session.getPublicPlayers());
        if (newMaster) {
          io.to(sessionId).emit('game:newGameMaster', { gameMasterId: newMaster });
        }
      }
    }
  });
});

// ========== Start Server ==========
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`CORS allowed origins: ${allowedOrigins.join(', ')}`);
});