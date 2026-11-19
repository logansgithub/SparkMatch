import express from "express";
import http from "http";
import path from "path";
import fs from "fs";
import cors from "cors";
import { Server } from "socket.io";
import { RoomManager } from "./roomManager";

const PORT = Number(process.env.PORT) || 3000;
const app = express();

app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
  pingInterval: 20000,
  pingTimeout: 20000,
});

const roomManager = new RoomManager();

// Health check endpoint for Render
app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    activeRooms: roomManager.getActiveRoomCount(),
  });
});

// Optional API endpoint to check room existence before joining
app.get("/api/rooms/:code", (req, res) => {
  const room = roomManager.getRoom(req.params.code);
  if (!room) {
    res.status(404).json({ exists: false });
    return;
  }
  res.status(200).json({
    exists: true,
    code: room.code,
    phase: room.phase,
    playerCount: room.players.size,
  });
});

// Broadcast helper
function broadcastRoomState(roomCode: string): void {
  const room = roomManager.getRoom(roomCode);
  if (!room) return;
  io.to(room.code).emit(
    "room_state_updated",
    roomManager.serializePublicState(room)
  );
}

io.on("connection", (socket) => {
  socket.on("create_room", (payload, ack) => {
    try {
      const { room, hostPlayer } = roomManager.createRoom({
        socketId: socket.id,
        hostName: payload?.hostName ?? "Host",
        avatar: payload?.avatar ?? "✨",
        spottingClue: payload?.spottingClue ?? "",
        hostParticipates: Boolean(payload?.hostParticipates),
        revealWorstEnemy: Boolean(payload?.revealWorstEnemy),
      });

      socket.join(room.code);
      const roomState = roomManager.serializePublicState(room);

      if (typeof ack === "function") {
        ack({
          ok: true,
          roomCode: room.code,
          playerId: hostPlayer.id,
          hostToken: room.hostToken,
          roomState,
        });
      }
      broadcastRoomState(room.code);
    } catch (err) {
      if (typeof ack === "function") {
        ack({
          ok: false,
          error: err instanceof Error ? err.message : "Failed to create room.",
        });
      }
    }
  });

  socket.on("join_room", (payload, ack) => {
    try {
      const { room, player } = roomManager.joinRoom({
        roomCode: payload?.roomCode ?? "",
        socketId: socket.id,
        name: payload?.name ?? "Guest",
        avatar: payload?.avatar ?? "🎉",
        spottingClue: payload?.spottingClue ?? "",
      });

      socket.join(room.code);
      const roomState = roomManager.serializePublicState(room);

      const activeQuestions =
        room.phase === "QUIZ" ? roomManager.getRoomQuestions(room) : undefined;

      if (typeof ack === "function") {
        ack({
          ok: true,
          playerId: player.id,
          roomState,
          questions: activeQuestions,
        });
      }

      if (activeQuestions) {
        socket.emit("quiz_started", { questions: activeQuestions });
      }

      broadcastRoomState(room.code);
    } catch (err) {
      if (typeof ack === "function") {
        ack({
          ok: false,
          error: err instanceof Error ? err.message : "Failed to join room.",
        });
      }
    }
  });

  socket.on("session_reconnect", (payload, ack) => {
    try {
      const { room, isHostVerified, playerMatch } = roomManager.reconnectPlayer(
        {
          roomCode: payload?.roomCode ?? "",
          playerId: payload?.playerId ?? "",
          hostToken: payload?.hostToken,
          socketId: socket.id,
        }
      );

      socket.join(room.code);
      const roomState = roomManager.serializePublicState(room);

      if (typeof ack === "function") {
        ack({
          ok: true,
          roomState,
          isHostVerified,
          questions:
            room.phase === "QUIZ"
              ? roomManager.getRoomQuestions(room)
              : undefined,
          playerMatch,
        });
      }

      broadcastRoomState(room.code);
    } catch (err) {
      if (typeof ack === "function") {
        ack({
          ok: false,
          error: err instanceof Error ? err.message : "Session expired.",
        });
      }
    }
  });

  socket.on("host_toggle_participate", (payload, ack) => {
    try {
      const room = roomManager.toggleHostParticipate(
        payload?.roomCode ?? "",
        payload?.hostToken ?? "",
        Boolean(payload?.hostParticipates)
      );
      broadcastRoomState(room.code);
      if (typeof ack === "function") ack({ ok: true });
    } catch (err) {
      if (typeof ack === "function") {
        ack({
          ok: false,
          error: err instanceof Error ? err.message : "Action failed.",
        });
      }
    }
  });

  socket.on("host_toggle_worst_enemy", (payload, ack) => {
    try {
      const room = roomManager.toggleRevealWorstEnemy(
        payload?.roomCode ?? "",
        payload?.hostToken ?? "",
        Boolean(payload?.revealWorstEnemy)
      );
      broadcastRoomState(room.code);
      if (typeof ack === "function") ack({ ok: true });
    } catch (err) {
      if (typeof ack === "function") {
        ack({
          ok: false,
          error: err instanceof Error ? err.message : "Action failed.",
        });
      }
    }
  });

  socket.on("host_select_pack", (payload, ack) => {
    try {
      const room = roomManager.selectPack(
        payload?.roomCode ?? "",
        payload?.hostToken ?? "",
        String(payload?.packId ?? "")
      );
      broadcastRoomState(room.code);
      if (typeof ack === "function") ack({ ok: true });
    } catch (err) {
      if (typeof ack === "function") {
        ack({
          ok: false,
          error:
            err instanceof Error ? err.message : "Failed to select question pack.",
        });
      }
    }
  });

  socket.on("host_kick_player", (payload, ack) => {
    try {
      const { room, kickedSocketId } = roomManager.kickPlayer(
        payload?.roomCode ?? "",
        payload?.hostToken ?? "",
        payload?.targetPlayerId ?? ""
      );

      if (kickedSocketId) {
        io.to(kickedSocketId).emit("player_kicked", {
          reason: "You were removed from the room by the host.",
        });
        const kickedSocket = io.sockets.sockets.get(kickedSocketId);
        kickedSocket?.leave(room.code);
      }

      broadcastRoomState(room.code);
      if (typeof ack === "function") ack({ ok: true });
    } catch (err) {
      if (typeof ack === "function") {
        ack({
          ok: false,
          error: err instanceof Error ? err.message : "Failed to kick player.",
        });
      }
    }
  });

  socket.on("host_add_bots", (payload, ack) => {
    try {
      const { room, addedCount } = roomManager.addBots(
        payload?.roomCode ?? "",
        payload?.hostToken ?? "",
        payload?.count ?? 5
      );
      broadcastRoomState(room.code);
      if (typeof ack === "function") ack({ ok: true, addedCount });
    } catch (err) {
      if (typeof ack === "function") {
        ack({
          ok: false,
          error: err instanceof Error ? err.message : "Failed to add bots.",
        });
      }
    }
  });

  socket.on("host_start_quiz", (payload, ack) => {
    try {
      const room = roomManager.startQuiz(
        payload?.roomCode ?? "",
        payload?.hostToken ?? ""
      );
      broadcastRoomState(room.code);
      io.to(room.code).emit("quiz_started", {
        questions: roomManager.getRoomQuestions(room),
      });
      if (typeof ack === "function") ack({ ok: true });
    } catch (err) {
      if (typeof ack === "function") {
        ack({
          ok: false,
          error: err instanceof Error ? err.message : "Failed to start quiz.",
        });
      }
    }
  });

  socket.on("submit_answers", (payload, ack) => {
    try {
      const room = roomManager.submitAnswers(
        payload?.roomCode ?? "",
        payload?.playerId ?? "",
        payload?.answers ?? {}
      );
      broadcastRoomState(room.code);
      if (typeof ack === "function") ack({ ok: true });
    } catch (err) {
      if (typeof ack === "function") {
        ack({
          ok: false,
          error:
            err instanceof Error ? err.message : "Failed to submit answers.",
        });
      }
    }
  });

  socket.on("host_calculate_matches", (payload, ack) => {
    try {
      const { room, matchCount, hasTrio } = roomManager.calculateMatches(
        payload?.roomCode ?? "",
        payload?.hostToken ?? ""
      );
      broadcastRoomState(room.code);
      io.to(room.code).emit("matches_ready", { matchCount, hasTrio });
      if (typeof ack === "function") {
        ack({ ok: true, matchCount, hasTrio });
      }
    } catch (err) {
      if (typeof ack === "function") {
        ack({
          ok: false,
          error:
            err instanceof Error ? err.message : "Failed to calculate matches.",
        });
      }
    }
  });

  socket.on("host_send_clues", (payload, ack) => {
    try {
      const { room, deliveries } = roomManager.triggerClues(
        payload?.roomCode ?? "",
        payload?.hostToken ?? ""
      );

      for (const delivery of deliveries) {
        io.to(delivery.socketId).emit("clue_received", {
          partnerClues: delivery.partnerClues,
        });
      }

      broadcastRoomState(room.code);
      if (typeof ack === "function") ack({ ok: true });
    } catch (err) {
      if (typeof ack === "function") {
        ack({
          ok: false,
          error: err instanceof Error ? err.message : "Failed to send clues.",
        });
      }
    }
  });

  socket.on("host_trigger_reveal", (payload, ack) => {
    try {
      const { room, deliveries } = roomManager.triggerReveal(
        payload?.roomCode ?? "",
        payload?.hostToken ?? ""
      );

      for (const delivery of deliveries) {
        io.to(delivery.socketId).emit("reveal_started", delivery.payload);
      }

      broadcastRoomState(room.code);
      if (typeof ack === "function") {
        ack({ ok: true, revealAt: room.revealAt });
      }
    } catch (err) {
      if (typeof ack === "function") {
        ack({
          ok: false,
          error:
            err instanceof Error ? err.message : "Failed to trigger reveal.",
        });
      }
    }
  });

  socket.on("host_reset_room", (payload, ack) => {
    try {
      const room = roomManager.resetRoom(
        payload?.roomCode ?? "",
        payload?.hostToken ?? ""
      );
      broadcastRoomState(room.code);
      if (typeof ack === "function") ack({ ok: true });
    } catch (err) {
      if (typeof ack === "function") {
        ack({
          ok: false,
          error: err instanceof Error ? err.message : "Failed to reset room.",
        });
      }
    }
  });

  socket.on("disconnect", () => {
    const room = roomManager.handleDisconnect(socket.id);
    if (room) {
      broadcastRoomState(room.code);
    }
  });
});

// Serve built React client when client/dist exists (works both in prod and local prod preview)
const clientDistPath = path.resolve(__dirname, "../../client/dist");
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));

  // SPA fallback for all non-API, non-socket, non-health GET routes (e.g., /join/ABCD)
  app.get("*", (req, res, next) => {
    if (
      req.path.startsWith("/api") ||
      req.path.startsWith("/socket.io") ||
      req.path === "/health"
    ) {
      next();
      return;
    }
    res.sendFile(path.join(clientDistPath, "index.html"));
  });
}

server.listen(PORT, "0.0.0.0", () => {
  console.log(`SparkMatch server running on http://0.0.0.0:${PORT}`);
});
