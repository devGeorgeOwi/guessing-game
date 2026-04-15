# 🎲 Guessing Game – Real-Time Multiplayer Quiz

[![Node.js](https://img.shields.io/badge/Node.js-20%2B-green)](https://nodejs.org/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.7-black)](https://socket.io/)
[![React](https://img.shields.io/badge/React-19-blue)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-8-purple)](https://vitejs.dev/)
[![Render](https://img.shields.io/badge/Render-Deployed-brightgreen)](https://render.com/)
[![Vercel](https://img.shields.io/badge/Vercel-Deployed-black)](https://vercel.com/)

A **real‑time multiplayer guessing game** where one player (Game Master) creates a session, builds a question bank, and starts rounds. Other players join, guess answers (3 attempts, 60 seconds), earn points, and the winner becomes the next Game Master.

> 🚀 **Live Demo**  
> Frontend: [https://guessing-game-three-tau.vercel.app](https://guessing-game-three-tau.vercel.app)  
> Backend: [https://guessing-game-backend-45sc.onrender.com](https://guessing-game-backend-45sc.onrender.com)

---

## 📖 Table of Contents

- [🎲 Guessing Game – Real-Time Multiplayer Quiz](#-guessing-game--real-time-multiplayer-quiz)
  - [📖 Table of Contents](#-table-of-contents)
  - [✨ Features](#-features)
  - [🛠 Tech Stack](#-tech-stack)
  - [🧱 Architecture](#-architecture)
  - [🚀 Getting Started](#-getting-started)
    - [Prerequisites](#prerequisites)
    - [Installation](#installation)
  - [Running Locally](#running-locally)
    - [Terminal 1 – Backend:](#terminal-1--backend)
    - [Terminal 2 - Frontend](#terminal-2---frontend)
  - [🔐 Environment Variables (table + code hints)](#-environment-variables-table--code-hints)
    - [Backend (`.env` in `server/` – optional)](#backend-env-in-server--optional)
    - [Frontend (`.env` in `client/`)](#frontend-env-in-client)
  - [📡 Socket.IO Events](#-socketio-events)
    - [Client → Server](#client--server)
    - [Server → Client](#server--client)
  - [🎮 Game Flow](#-game-flow)
  - [☁️ Deployment](#️-deployment)
    - [Backend (Render)](#backend-render)
    - [Frontend (Vercel)](#frontend-vercel)
  - [🐛 Troubleshooting](#-troubleshooting)
  - [🔮 Future Improvements](#-future-improvements)
  - [📄 License](#-license)
  - [👨‍💻 Author](#-author)

---

## ✨ Features

- **Live multiplayer** – WebSocket‑powered real‑time communication.
- **Game Master role** – create sessions, manage question bank, start rounds.
- **Question Bank** – prepare multiple Q&A pairs before the game starts.
- **Round logic** – each round uses the next question (cycles automatically).
- **3 attempts per player** – case‑insensitive answer matching.
- **60‑second timer** – round ends automatically if no correct guess.
- **Scoring** – +10 points for the first correct answer.
- **Winner becomes next Game Master** – unless timeout (rotates to next player).
- **Live scoreboard** – all players see each other’s scores.
- **Session lifecycle** – auto‑deleted when last player leaves.
- **Responsive UI** – works on desktop and mobile.

---

## 🛠 Tech Stack

| Layer          | Technology                                        |
| -------------- | ------------------------------------------------- |
| **Backend**    | Node.js 20+ / Express / Socket.IO                 |
| **Frontend**   | React 18 / Vite / Tailwind CSS                    |
| **Real‑time**  | Socket.IO (WebSockets + HTTP polling fallback)    |
| **State**      | In‑memory Map (sessions, players, question banks) |
| **Deployment** | Render (backend) + Vercel (frontend)              |

---

## 🧱 Architecture

┌─────────────┐ WebSocket/HTTP ┌─────────────┐
│ Browser │ ◄──────────────────────► │ Render │
│ (React) │ Socket.IO │ (Node.js) │
└─────────────┘ └─────────────┘
▲ │
│ │
└───────────── HTTP polling fallback ───────┘


- **Frontend** (Vercel): static React build, connects to backend via `VITE_SOCKET_URL`.
- **Backend** (Render): Express + Socket.IO server, manages game state in memory.
- **No database** – all state ephemeral (resets on restart). Suitable for casual play.

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+ ([download](https://nodejs.org/))
- npm 9+ (comes with Node)
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/devGeorgeOwi/guessing-game.git
cd guessing-game

# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```
## Running Locally

### Terminal 1 – Backend:
```bash
cd server
npm run dev   # uses node --watch for auto-restart

# Backend runs on http://localhost:3001
```
### Terminal 2 - Frontend
```bash
cd client
npm run dev   # Vite dev server

 # Frontend runs on `http://localhost:5173`

# Open http://localhost:5173 in multiple browser windows to simulate multiple players.

```


---

## 🔐 Environment Variables (table + code hints)

### Backend (`.env` in `server/` – optional)

| Variable         | Description                          | Default                     |
|------------------|--------------------------------------|-----------------------------|
| `PORT`           | HTTP port                            | `3001`                      |
| `FRONTEND_URL`   | Your live frontend URL (no trailing slash) | `http://localhost:5173` |

### Frontend (`.env` in `client/`)

| Variable           | Description                          | Default                     |
|--------------------|--------------------------------------|-----------------------------|
| `VITE_SOCKET_URL`  | Backend WebSocket URL                | `http://localhost:3001`     |

For production (Vercel), set `VITE_SOCKET_URL` in the Vercel dashboard.

## 📡 Socket.IO Events

### Client → Server

| Event                  | Payload                                        | Description                              |
|------------------------|------------------------------------------------|------------------------------------------|
| `session:create`       | `{ playerName }`                               | Create a new session (becomes Game Master) |
| `session:join`         | `{ sessionId, playerName }`                   | Join an existing session                 |
| `session:leave`        | `{ sessionId }`                               | Leave current session                    |
| `game:setQuestions`    | `{ sessionId, questions }`                    | Save question bank (Game Master only)    |
| `game:start`           | `{ sessionId }`                               | Start the game (Game Master only)        |
| `game:guess`           | `{ sessionId, guess }`                        | Submit a guess for current question      |

### Server → Client

| Event                  | Payload                                                                 | Description                              |
|------------------------|-------------------------------------------------------------------------|------------------------------------------|
| `players:update`       | `[{ id, name, score, isGameMaster }]`                                   | Refresh player list & scores             |
| `game:started`         | `{ question, timeLimit, startedAt }`                                    | Round started, display question & timer  |
| `game:expired`         | `{ answer, message }`                                                   | Timeout – no winner                      |
| `game:winner`          | `{ winnerId, winnerName, answer, pointsAwarded }`                       | Someone guessed correctly                |
| `game:ended`           | `{ nextGameMaster, winner }`                                            | Round finished, return to lobby          |
| `game:newGameMaster`   | `{ gameMasterId }`                                                      | Role transferred to another player       |
| `guess:result`         | `{ playerId, playerName, attemptsLeft }`                                | Wrong guess (broadcast)                  |


## 🎮 Game Flow

1. Create Session – first player becomes Game Master (GM), receives a 6‑character session code.

2. Others Join – using the code (must be before game starts).

3. GM Builds Question Bank – adds multiple Q&A pairs in the lobby.

4. GM Starts Game – requires ≥2 players and ≥1 question.

5. Round Begins – all players see the first question, a 60‑second timer, and have 3 attempts.

6. Correct Guess – winner gets +10 points; round ends immediately; answer revealed.

7. Timeout – if timer reaches 0, round ends with no winner; answer revealed.

8. Round Ends – players return to lobby; winner (or next player) becomes new GM.

9. Next Round – new GM clicks "Start Game" – the next question from the bank is used.

10. Leaving – any player can leave; session auto‑deletes when empty.

## ☁️ Deployment

### Backend (Render)

1. Push code to GitHub.
2. On [Render](https://render.com), create a **New Web Service**.
3. Connect your GitHub repo, set:
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `node index.js`
4. Add environment variable:
   - `FRONTEND_URL` = your Vercel frontend URL (e.g., `https://guessing-game-three-tau.vercel.app`)
5. Click **Create Web Service**.

Your backend will be available at `https://your-backend.onrender.com`.

### Frontend (Vercel)

1. On [Vercel](https://vercel.com), import the same GitHub repo.
2. Configure:
   - **Root Directory**: `client`
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Add environment variable:
   - `VITE_SOCKET_URL` = your Render backend URL (e.g., `https://guessing-game-backend.onrender.com`)
4. Click **Deploy**.

Your frontend will be available at `https://your-project.vercel.app`.

## 🐛 Troubleshooting

| Issue                                      | Solution                                                                 |
|--------------------------------------------|--------------------------------------------------------------------------|
| **CORS errors**                            | Ensure `FRONTEND_URL` on Render matches **exactly** (no trailing slash). Also check Socket.IO `cors.origin` function. |
| **WebSocket connection fails**             | Force HTTP polling fallback in frontend: `transports: ['polling', 'websocket']`. Render free tier may have WebSocket timeouts. |
| **"Session not found"**                    | Verify the session code is correct (6 uppercase chars). Session may have been deleted if all players left. |
| **Game won't start**                       | Need at least 2 players AND at least 1 question in the bank.            |
| **Timer not working**                      | Check backend logs – timer uses `setTimeout`; ensure no errors in `game:start` handler. |
| **Players can't join during game**         | Intended behaviour – join only allowed in lobby.                        |
| **Render logs show "Cannot find module"**  | Ensure `"type": "module"` in `server/package.json` and use `import` syntax. |

## 🔮 Future Improvements

- **Persistent storage** – use PostgreSQL (Render) to save scores and question banks across restarts.
- **User authentication** – login with Google/GitHub to keep profiles.
- **Custom time limit** – let GM choose 30/60/90 seconds.
- **Random question order** – instead of sequential cycling.
- **Chat** – allow players to chat during lobby and between rounds.
- **Spectator mode** – non‑players can watch without guessing.

## 📄 License

[MIT](https://choosealicense.com/licenses/mit/)

## 👨‍💻 Author

Built as a production‑grade real‑time multiplayer game demonstration.  
Follows modern JavaScript (ES Modules), React Hooks, Socket.IO best practices, and clean separation of concerns.

**Enjoy the game!** 🎲  
Questions or issues? [Open an issue](https://github.com/devGeorgeOwi/guessing-game/issues) or reach out to [@devGeorgeOwi](https://github.com/devGeorgeOwi).