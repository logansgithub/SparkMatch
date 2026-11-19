# SparkMatch — Implementation Plan

## 1. Overview
**SparkMatch** is a mobile-first, real-time multiplayer party game inspired by Matchbox. A host creates a room and displays a QR code; friends join on their phones with no account required, answer a silly personality quiz, and experience a synchronized countdown that reveals their closest match (plus why they matched).

The project is architected as a **single-service Node.js + React web app** optimized for free, permanent cloud hosting on **Render's Free Web Service** (ephemeral filesystem, single port, zero external database dependencies).

---

## 2. Tech Stack & Project Structure
- **Monorepo:** Root `package.json` using **npm workspaces** (`["client", "server"]`) so one `npm install --include=dev` installs everything cleanly on Render.
- **Frontend (`client/`):** React 18+, TypeScript, Vite, Tailwind CSS, Framer Motion, `qrcode.react`, `socket.io-client`.
- **Backend (`server/`):** Node.js 20+, TypeScript, Express 4 (`express@^4.21.0` to avoid Express 5 wildcard route issues), Socket.IO, `vitest` (testing).
- **State Store:** In-memory `Map<string, Room>` on the server with automatic garbage collection clearing rooms inactive for more than 4 hours. No SQLite, Postgres, or native C++ build dependencies.

```text
sparkmatch/
├── implementation_plan.md
├── package.json              # npm workspaces + root dev/build/start/test scripts
├── render.yaml               # Render Free Blueprint config
├── .gitignore
├── README.md
├── client/
│   ├── package.json
│   ├── index.html
│   ├── vite.config.ts        # Proxies /api, /health, and /socket.io to localhost:3000 in dev
│   └── src/
│       ├── main.tsx
│       ├── App.tsx           # Routing (/ and /join/:code) + socket/session state
│       ├── lib/socket.ts     # Socket.IO client connecting to window.location.origin
│       ├── types.ts          # Shared frontend types
│       └── components/
│           ├── LandingScreen.tsx
│           ├── JoinForm.tsx
│           ├── HostDashboard.tsx
│           ├── QuizScreen.tsx
│           ├── WaitingRoom.tsx
│           ├── ClueTeaser.tsx
│           └── RevealScreen.tsx
└── server/
    ├── package.json
    ├── tsconfig.json
    └── src/
        ├── index.ts          # Express + Socket.IO server, static serving, /health, SPA fallback
        ├── types.ts          # Room, Player, Question, MatchGroup types
        ├── questions.ts      # 12 editable silly personality questions
        ├── roomManager.ts    # In-memory room lifecycle, bot generator, 4hr GC
        ├── matching.ts       # Pairwise scoring, global optimal matching, trio logic, rarity insights
        └── matching.test.ts  # Vitest unit test suite
```

---

## 3. Data Models & Room Lifecycle

### Game Phases
`LOBBY` -> `QUIZ` -> `MATCHED` -> `CLUES` (optional teaser) -> `REVEAL`

### Core Types
```ts
export type QuestionType = "scale" | "choice";

export interface Question {
  id: string;
  type: QuestionType;
  prompt: string;
  // For "scale" (1 to 5):
  lowLabel?: string;
  highLabel?: string;
  // For "choice" (4 options, values 0..3):
  options?: string[];
  // Short templates used for insight cards:
  topicTag: string;
}

export interface Player {
  id: string;
  socketId: string | null;
  name: string;
  avatar: string;         // Emoji avatar
  spottingClue: string;   // Optional 1-line hint, e.g., "wearing red sneakers"
  isHost: boolean;
  isBot: boolean;
  connected: boolean;
  answers: Record<string, number>; // questionId -> numeric answer
  quizCompleted: boolean;
}

export interface MatchInsight {
  questionId: string;
  topicTag: string;
  description: string;    // Human-readable explanation
  rarityScore: number;    // Higher = rarer shared answer in this room
}

export interface MatchGroup {
  playerIds: string[];    // Length 2 (pair) or 3 (trio for odd counts)
  compatibility: number;  // 0 to 100 integer
  sharedHighlights: MatchInsight[]; // Top 2 rarest shared answers
  spicyDifference: MatchInsight;    // Largest playful disagreement
}

export interface Room {
  code: string;           // 4 uppercase letters (no ambiguous chars like O/I)
  hostToken: string;      // Secret UUID for authenticating host actions
  hostParticipates: boolean;
  phase: "LOBBY" | "QUIZ" | "MATCHED" | "CLUES" | "REVEAL";
  players: Map<string, Player>;
  matches: MatchGroup[];
  revealAt: number | null; // Absolute UTC timestamp (ms)
  lastActiveAt: number;
}
```

### Session Reconnection
- On joining or hosting, the client saves `{ roomCode, playerId, hostToken? }` to `localStorage`.
- On reconnect or page refresh, the client emits `session_reconnect`. If the room still exists, the server updates `player.socketId`, sets `connected = true`, and returns the player's current phase state (including their match if already in `CLUES` or `REVEAL`).

---

## 4. Matching Algorithm (`server/src/matching.ts`)

### Step 1: Pairwise Compatibility (0–100)
For any two players $A$ and $B$ across all answered questions:
- **Scale question (1–5):** Similarity $s_q = 1 - \frac{\vert{}a_q - b_q\vert{}}{4}$ (ranges `0.0` to `1.0`).
- **Choice question (0–3):** Similarity $s_q = 1.0$ if $a_q === b_q$, else $0.0$.
- **Raw Compatibility:** $\text{score}(A, B) = \text{round}\left(100 \times \frac{1}{\vert{}Q\vert{}} \sum_{q \in Q} s_q\right)$.

### Step 2: Welfare-Adjusted Edge Weight
To prevent the optimizer from sacrificing one person with a miserable match just to nudge another pair from 88% to 92%, compute optimization weight:
```ts
const weight = score - (score < 40 ? (40 - score) * 1.5 : 0);
```

### Step 3: Global Maximum Weight Perfect Matching (No Greedy Traps)
Let $N$ be the number of participating players who completed the quiz ($N \ge 2$).
- **Even $N \le 16$:** Run exact **Bitmask Dynamic Programming** over all subsets (pinning the lowest unset bit $i$ and trying every unset partner $j > i$). This is 100% mathematically optimal and runs in under 15ms.
- **Even $N > 16$:** Run **multi-start 2-opt pairwise swap optimization** (30 randomized initial matchings; repeatedly swap pairs $(a,b),(c,d) \to (a,c),(b,d)$ or $(a,d),(b,c)$ whenever total weight strictly increases, keeping the highest global total).
- **Odd $N$ (Trio Formation):**
  - If $N === 3$: Form a single trio of all 3 players.
  - If $N \ge 5$ and odd: Iterate over every player $t \in \{0..N-1\}$ as the candidate third wheel. Solve optimal even pairing for the remaining $N-1$ players, then attach $t$ to whichever existing pair $(u, v)$ maximizes the trio's average compatibility $\frac{w(u,v) + w(u,t) + w(v,t)}{3}$ minus the pair's original $w(u,v)$. Select the global configuration with the highest combined room weight.

### Step 4: Rarity-Weighted Match Insights
For each question $q$, compute the room frequency $f(q, v)$ = fraction of participating players in the room who gave answer $v$.
- **2 "Why You Matched" Highlights:** Find questions where the pair agreed exactly (or within 1 point on a scale question). Score each agreement by rarity:
  - Exact match rarity = $1 - f(q, v)$ (plus small bonus for exact choice match).
  - Close scale match ($\Delta = 1$) rarity = $0.5 \times (1 - \text{avg}(f(q, a), f(q, b)))$.
  - Pick the top 2 highest-rarity agreements and format readable descriptions (e.g., *"Only 2 people in the room would try to befriend the raccoon—and you're both here."*).
- **1 "Spicy Difference":** Pick the question with the lowest similarity $s_q$ (tie-break by largest absolute scale gap or rarest combined picks) and format a playful contrast.

---

## 5. Quiz Question Bank (`server/src/questions.ts`)
Seed with 12 funny, party-ready questions (mix of 6 `scale` and 6 `choice`), covering topics such as:
1. Zombie apocalypse survival role (`choice`)
2. Pineapple on pizza stance (`scale`: 1 = Culinary Crime, 5 = Peak Gastronomy)
3. Texting reply speed (`choice`: instant reply vs. 3-business-day ghost)
4. Befriending a suspicious raccoon in an alley (`scale`)
5. Ideal heist crew role (`choice`: Mastermind, Getaway Driver, Tech Hacker, Distraction)
6. Leaving a party via Irish Goodbye (`scale`)
7. Surviving 24 hours without your phone (`scale`)
8. Karaoke song strategy (`choice`: Unhinged duet, Power ballad, Crowd hype, Hiding in the back)
9. Arguing with strangers in internet comments (`scale`)
10. First purchase after winning $10M (`choice`: Secret lair, Endless travel, Ridiculous pet, Disappear quietly)
11. How early you arrive at the airport (`choice`: 4 hours early, Right at boarding, Sprint to gate, Pure chaos)
12. Believing you could safely land a commercial plane in an emergency (`scale`)

---

## 6. Socket.IO Event Contract

### Client -> Server
- `create_room` `{ hostName, avatar, spottingClue, hostParticipates }` -> ack `{ roomCode, playerId, hostToken }`
- `join_room` `{ roomCode, name, avatar, spottingClue }` -> ack `{ playerId, roomState }`
- `session_reconnect` `{ roomCode, playerId, hostToken? }` -> ack `{ ok, roomState, playerMatch? }`
- `host_toggle_participate` `{ roomCode, hostToken, hostParticipates }`
- `host_kick_player` `{ roomCode, hostToken, targetPlayerId }`
- `host_add_bots` `{ roomCode, hostToken, count }` (default `5`; adds realistic named bots who auto-complete the quiz with varied randomized answers)
- `host_start_quiz` `{ roomCode, hostToken }`
- `submit_answers` `{ roomCode, playerId, answers }`
- `host_calculate_matches` `{ roomCode, hostToken }`
- `host_send_clues` `{ roomCode, hostToken }`
- `host_trigger_reveal` `{ roomCode, hostToken }`
- `host_reset_room` `{ roomCode, hostToken }`

### Server -> Client
- `room_state_updated` (public room snapshot: phase, players list with connection & quiz status, counts — never leaks other players' matches)
- `quiz_started` `{ questions }`
- `matches_ready` `{ matchCount, hasTrio }`
- `clue_received` `{ partnerClues: string[] }` (sent privately to each player's socket)
- `reveal_started` `{ revealAt: number, match: MatchGroup, partners: Array<{ name, avatar, spottingClue }> }` (sent privately to each player's socket with shared `revealAt = Date.now() + 10000`)
- `player_kicked` `{ reason }`

---

## 7. Visual Direction & Mobile UX
- **Aesthetic:** Warm indie party game / tactile risograph card vibe. Cream paper background (`#FFF8EE`), deep charcoal ink (`#1A1826`), vibrant accents (coral `#FF5A5F`, marigold `#FFB703`, electric indigo `#4F46E5`), chunky borders (`2px solid #1A1826`) with crisp offset hard shadows (`4px 4px 0 #1A1826`), and bold display typography (Google Fonts: `Space Grotesk` or `Syne` + `DM Sans`).
- **Mobile-first layout:** Generous 48px+ tap targets, single-column centered container (`max-w-md`), one quiz question per screen with Framer Motion slide transitions, progress bar, and a 3D card-flip animation when the synced countdown hits `0`.
- **QR Code:** Host dashboard renders `<QRCodeSVG value={`${window.location.origin}/join/${roomCode}`} />` plus a one-tap "Copy Invite Link" button.

---

## 8. Render Free Cloud Hosting Configuration
- **Port & Host:** Server binds to `Number(process.env.PORT) || 3000` on `0.0.0.0`.
- **Health Check:** `GET /health` returns HTTP `200` with `{ status: "ok", activeRooms: number }`.
- **Static & SPA Fallback:** In production (or whenever `client/dist` exists), Express serves `client/dist` via `express.static` and routes all non-API/non-socket GET requests (such as `/join/WXYZ`) to `client/dist/index.html`.
- **Socket.IO Keepalive:** Set `pingInterval: 20000`, `pingTimeout: 20000` for resilient mobile connections on Render.
- **`render.yaml` at repository root:**
```yaml
services:
  - type: web
    name: sparkmatch
    runtime: node
    plan: free
    buildCommand: npm install --include=dev && npm run build
    startCommand: npm start
    healthCheckPath: /health
    envVars:
      - key: NODE_ENV
        value: production
```

---

## 9. Verification & Testing Checklist
1. **Unit Tests (`npm test`):** `server/src/matching.test.ts` passes all tests covering:
   - Even players: proves global Bitmask DP beats a crafted greedy trap matrix.
   - Odd players (5 and 7 players): verifies exactly 1 trio, all players matched, 0 duplicates/orphans.
   - Edge minimums: 2 players (1 pair) and 3 players (1 trio).
   - Larger room (20 players): verifies multi-start 2-opt completes quickly and returns valid perfect matching.
   - Rarity insights: proves rare shared answers outrank common room-wide answers.
2. **Production Build Verification:** Run `npm run build && npm start` and confirm:
   - `GET /health` returns `200 OK`.
   - `GET /join/ABCD` returns the React app HTML cleanly (no 404).
3. **Browser End-to-End Verification:**
   - Open Host view, create room, verify QR code URL matches `window.location.origin/join/CODE`.
   - Click "Add Test Bots" (5 bots), join as a real guest in a second tab, start quiz, finish quiz, calculate matches, send clues, trigger synced 10s reveal, and confirm the flip card renders partner name, avatar, spotting clue, compatibility %, 2 rarity highlights, and 1 spicy difference.
