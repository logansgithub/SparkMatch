# SparkMatch

**SparkMatch** is a mobile-first, real-time multiplayer personality-matching party game inspired by Matchbox. A host spins up a room and displays a QR code; friends scan and join from their phones with zero accounts or downloads, answer 12 silly personality prompts, and experience a synchronized 10-second countdown that flips every card together to reveal their closest match — complete with rarity-weighted highlights and one spicy disagreement.

---

## Features

- **Zero-friction mobile join:** Scan a QR code or visit `/join/CODE` from any phone browser.
- **Global optimal matching (no greedy traps):**
  - Welfare-adjusted scoring penalizes miserable matches (`< 40%`) so nobody gets sacrificed.
  - Exact **Bitmask Dynamic Programming** for even rooms up to 16 players.
  - **Multi-start 2-opt optimization** (30 restarts) for larger even rooms (`> 16`).
  - Automatic optimal **Power Trio** formation for odd player counts (`3, 5, 7, ...`).
- **Rarity-weighted insights:** Computes answer frequency across the entire room so rare shared opinions rank above common answers, plus surfaces each match's biggest playful disagreement.
- **Built-in test bots:** Hosts can add 5 realistic bots in one click to test or fill out a room.
- **Resilient sessions:** Automatic `localStorage` session persistence and Socket.IO reconnection survive page refreshes and mobile screen locks.
- **Single-service architecture:** Express + Socket.IO serves the built React app on a single port with in-memory room state and 4-hour automatic garbage collection — zero database setup required.

---

## Local Development

### Prerequisites
- **Node.js 20+** and **npm 10+**

### Commands

```bash
# 1. Install all workspace dependencies (root, client, server)
npm install --include=dev

# 2. Run both the Socket.IO backend (port 3000) and Vite frontend (port 5173) in dev mode
npm run dev
```

Open `http://localhost:5173` in your browser. Vite automatically proxies `/api`, `/health`, and `/socket.io` to `http://localhost:3000`.

### Testing & Production Build

```bash
# Run the Vitest matching algorithm test suite
npm test

# Build both client (Vite -> client/dist) and server (tsc -> server/dist)
npm run build

# Start the single-service production server on http://localhost:3000
npm start
```

---

## Customizing the Quiz Questions

All 12 quiz prompts live in [`server/src/questions.ts`](server/src/questions.ts). You can add, remove, or rewrite questions directly in the `QUESTIONS` array:

- **`scale` questions** (1 to 5 rating):
  ```ts
  {
    id: "q2",
    type: "scale",
    prompt: "Pineapple on pizza — where do you stand?",
    lowLabel: "Culinary Crime",
    highLabel: "Peak Gastronomy",
    topicTag: "Pineapple on Pizza",
  }
  ```
- **`choice` questions** (4 multiple-choice options, values `0..3`):
  ```ts
  {
    id: "q5",
    type: "choice",
    prompt: "Your friend group plans a museum heist. What is your crew role?",
    options: [
      "The Mastermind",
      "The Getaway Driver",
      "The Tech Hacker",
      "The Chaotic Distraction",
    ],
    topicTag: "Heist Crew Role",
  }
  ```

Keep every `id` unique (e.g. `"q13"`), and use a short, punchy `topicTag` since it appears on the final Match Reveal card. After editing `server/src/questions.ts`, restart `npm run dev` (or re-run `npm run build && npm start` in production).

---

## Deploy for Free on Render (GitHub + Blueprint)

This repository includes a pre-configured [`render.yaml`](render.yaml) Blueprint for **Render's Free Web Service** tier.

1. **Push this repository to GitHub** (if you haven't already):
   ```bash
   git add .
   git commit -m "Deploy SparkMatch"
   git push -u origin main
   ```
2. **Sign in to [Render](https://render.com/)** and click **New + -> Blueprint** in the top navigation bar.
3. **Connect your GitHub repository** (`SparkMatch`). Render automatically detects `render.yaml` at the root of the repo.
4. **Review & Apply:** Confirm the `sparkmatch` web service settings:
   - **Plan:** Free
   - **Build Command:** `npm install --include=dev && npm run build`
   - **Start Command:** `npm start`
   - **Health Check Path:** `/health`
   - **Environment Variable:** `NODE_ENV=production`
5. Click **Apply** and wait for the initial build to finish (~2 minutes). Your live URL (e.g., `https://sparkmatch.onrender.com`) is ready to host parties!

> **Note on Render Free Tier Cold Starts:** Render's free web services spin down after 15 minutes of inactivity. The very first request after a period of inactivity takes **~50–60 seconds** to wake up the container. Before your party starts, open your SparkMatch URL once about a minute ahead of time so the server is warm and instant for your guests! Also note that rooms are stored in memory, so active rooms reset if the server restarts or spins down.
