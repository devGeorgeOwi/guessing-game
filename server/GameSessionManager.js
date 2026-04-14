import { GameSession } from './GameSession.js';

export class GameSessionManager {
  constructor() {
    this.sessions = new Map();
  }

  createSession(gameMasterId, gameMasterName) {
    const sessionId = crypto.randomUUID().slice(0, 6).toUpperCase();
    const session = new GameSession(sessionId, gameMasterId, gameMasterName);
    this.sessions.set(sessionId, session);
    return session;
  }

  getSession(sessionId) {
    return this.sessions.get(sessionId);
  }

  deleteSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (session?.timer) clearTimeout(session.timer);
    this.sessions.delete(sessionId);
  }

  findSessionByPlayerId(playerId) {
    for (const [sessionId, session] of this.sessions) {
      if (session.hasPlayer(playerId)) {
        return { session, sessionId };
      }
    }
    return null;
  }
}