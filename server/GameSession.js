export class GameSession {
  constructor(sessionId, gameMasterId, gameMasterName) {
    this.sessionId = sessionId;
    this.gameMasterId = gameMasterId;
    this.players = new Map(); // id -> { id, name, score }
    this.isGameActive = false;
    this.currentQuestion = null;
    this.currentAnswer = null;
    this.timeLimit = 60;
    this.timer = null;
    this.winnerId = null;
    this.playerAttempts = new Map(); // playerId -> attemptsLeft
    this.questionQueue = [];
    this.currentQuestionIndex = -1;
    
    this.players.set(gameMasterId, { id: gameMasterId, name: gameMasterName, score: 0 });
  }

  addPlayer(playerId, playerName) {
    if (this.isGameActive) {
      return { success: false, error: 'Game in progress, cannot join' };
    }
    if (this.players.has(playerId)) {
      return { success: false, error: 'Already in session' };
    }
    if (this.players.size >= 10) {
      return { success: false, error: 'Session full (max 10)' };
    }
    if (playerName.length < 2) {
      return { success: false, error: 'Name too short' };
    }
    this.players.set(playerId, { id: playerId, name: playerName, score: 0 });
    return { success: true };
  }

  removePlayer(playerId) {
    const wasGameMaster = this.gameMasterId === playerId;
    this.players.delete(playerId);
    this.playerAttempts.delete(playerId);
    
    if (wasGameMaster && this.players.size > 0) {
      const nextId = this.players.keys().next().value;
      this.gameMasterId = nextId;
      return nextId;
    }
    return null;
  }

  hasPlayer(playerId) {
    return this.players.has(playerId);
  }

  getPlayerName(playerId) {
    return this.players.get(playerId)?.name ?? 'Unknown';
  }

  getPlayerCount() {
    return this.players.size;
  }

  canStartGame() {
    return !this.isGameActive && this.players.size >= 2;
  }

  startGame() {
    if (!this.canStartGame()) {
      return { success: false, error: `Need at least 2 players (current: ${this.players.size})` };
    }
    const next = this.getNextQuestion();
    if (!next) {
      return { success: false, error: 'No questions in the bank. Add questions first.' };
    }
    this.isGameActive = true;
    this.currentQuestion = next.question;
    this.currentAnswer = next.answer;
    this.winnerId = null;
    // Reset attempts
    this.playerAttempts.clear();
    for (const pid of this.players.keys()) {
      this.playerAttempts.set(pid, 3);
    }
    return { success: true };
  }

  submitGuess(playerId, guess) {
    if (!this.isGameActive) return { success: false, error: 'No active game' };
    if (this.winnerId) return { success: false, error: 'Game already ended' };
    if (!this.players.has(playerId)) return { success: false, error: 'Not in session' };
    
    const attemptsLeft = this.playerAttempts.get(playerId) ?? 0;
    if (attemptsLeft <= 0) return { success: false, error: 'No attempts left' };
    
    const normalizedGuess = guess?.toLowerCase().trim();
    const isCorrect = normalizedGuess === this.currentAnswer;
    
    if (isCorrect) {
      const player = this.players.get(playerId);
      player.score += 10;
      this.winnerId = playerId;
      return { success: true, correct: true, attemptsLeft };
    } else {
      const newAttempts = attemptsLeft - 1;
      this.playerAttempts.set(playerId, newAttempts);
      return { success: true, correct: false, attemptsLeft: newAttempts };
    }
  }

  endGame(hasWinner) {
    this.isGameActive = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (hasWinner && this.winnerId) {
      this.gameMasterId = this.winnerId;
    } else if (this.players.size > 0) {
      // Rotate to next player
      const ids = Array.from(this.players.keys());
      const currentIdx = ids.indexOf(this.gameMasterId);
      const nextIdx = (currentIdx + 1) % ids.length;
      this.gameMasterId = ids[nextIdx];
    }
  }

  setTimer(timer) {
    this.timer = timer;
  }

  addQuestion(question, answer) {
    this.questionQueue.push({ 
      question: question.trim(), 
      answer: answer.toLowerCase().trim() 
    });
  }

  removeQuestion(index) {
    this.questionQueue.splice(index, 1);
    // Adjust index if needed
    if (this.currentQuestionIndex >= this.questionQueue.length) {
      this.currentQuestionIndex = this.questionQueue.length - 1;
    }
  }

  clearQuestions() {
    this.questionQueue = [];
    this.currentQuestionIndex = -1;
  }

  getNextQuestion() {
    if (this.questionQueue.length === 0) return null;
    this.currentQuestionIndex = (this.currentQuestionIndex + 1) % this.questionQueue.length;
    return this.questionQueue[this.currentQuestionIndex];
  }

  setQuestions(questions) {
    this.clearQuestions();
    for (const q of questions) {
      if (q.question?.trim() && q.answer?.trim()) {
        this.addQuestion(q.question, q.answer);
      }
    }
  }

  getPublicPlayers() {
    return Array.from(this.players.values()).map(p => ({
      id: p.id,
      name: p.name,
      score: p.score,
      isGameMaster: p.id === this.gameMasterId
    }));
  }
}