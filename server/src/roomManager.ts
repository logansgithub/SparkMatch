import crypto from "crypto";
import {
  DEFAULT_PACK_ID,
  getPublicPackMetas,
  getQuestionPack,
  getQuestionPackOrDefault,
  toPackMeta,
} from "./questionPacks";
import { computeRoomMatches, computeWorstEnemies } from "./matching";
import {
  MatchGroup,
  PartnerProfile,
  Player,
  PublicPlayer,
  PublicRoomState,
  Question,
  ReconnectMatchState,
  RevealPayload,
  Room,
  WorstEnemyReveal,
} from "./types";

// 4-letter room codes excluding ambiguous chars O, I, L, 0, 1
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ";
const FOUR_HOURS_MS = 4 * 60 * 60 * 1000;
const GC_INTERVAL_MS = 15 * 60 * 1000;

const BOT_PROFILES: Array<{ name: string; avatar: string; clue: string }> = [
  { name: "Maya", avatar: "🦊", clue: "wearing retro red sneakers" },
  { name: "Leo", avatar: "🪩", clue: "holding an iced matcha near the snacks" },
  { name: "Priya", avatar: "🐙", clue: "rocking a mustard beanie" },
  { name: "Devon", avatar: "🦖", clue: "wearing a vintage denim jacket" },
  { name: "Chloe", avatar: "⚡", clue: "has sparkly gold earrings" },
  { name: "Mateo", avatar: "🌮", clue: "standing near the playlist speaker" },
  { name: "Samira", avatar: "🦋", clue: "wearing chunky tortoise glasses" },
  { name: "Noah", avatar: "🎸", clue: "in a striped sweater" },
  { name: "Zoe", avatar: "🍒", clue: "wearing platform boots" },
  { name: "Kai", avatar: "🪐", clue: "has a tote bag covered in pins" },
  { name: "Tessa", avatar: "🐝", clue: "laughing loudest by the couch" },
  { name: "Omar", avatar: "🔥", clue: "wearing an oversized green hoodie" },
  { name: "Jules", avatar: "🌈", clue: "wearing a bucket hat indoors" },
  { name: "Ravi", avatar: "🎲", clue: "holding a sparkling water can" },
  { name: "Elena", avatar: "🍄", clue: "wearing bright cobalt socks" },
  { name: "Finn", avatar: "🐧", clue: "in a graphic band tee" },
  { name: "Nora", avatar: "🎨", clue: "wearing silver rings on every finger" },
  { name: "Liam", avatar: "🚀", clue: "leaning by the kitchen counter" },
  { name: "Iris", avatar: "🌻", clue: "wearing a corduroy jacket" },
  { name: "Diego", avatar: "🎧", clue: "wearing round wire-frame glasses" },
];

export class RoomManager {
  private rooms = new Map<string, Room>();
  private socketIndex = new Map<string, { roomCode: string; playerId: string }>();
  private gcTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.startGarbageCollector();
  }

  private startGarbageCollector(): void {
    this.gcTimer = setInterval(() => {
      const now = Date.now();
      for (const [code, room] of this.rooms.entries()) {
        if (now - room.lastActiveAt > FOUR_HOURS_MS) {
          for (const player of room.players.values()) {
            if (player.socketId) {
              this.socketIndex.delete(player.socketId);
            }
          }
          this.rooms.delete(code);
        }
      }
    }, GC_INTERVAL_MS);

    // Do not keep Node process alive solely for GC timer
    if (this.gcTimer.unref) {
      this.gcTimer.unref();
    }
  }

  public stopGarbageCollector(): void {
    if (this.gcTimer) {
      clearInterval(this.gcTimer);
      this.gcTimer = null;
    }
  }

  public getActiveRoomCount(): number {
    return this.rooms.size;
  }

  public getRoom(code: string): Room | undefined {
    return this.rooms.get(code.trim().toUpperCase());
  }

  private generateRoomCode(): string {
    for (let attempt = 0; attempt < 50; attempt++) {
      let code = "";
      for (let i = 0; i < 4; i++) {
        code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
      }
      if (!this.rooms.has(code)) {
        return code;
      }
    }
    throw new Error("Could not allocate a unique room code.");
  }

  public getRoomQuestions(room: Room): Question[] {
    return getQuestionPackOrDefault(room.selectedPackId).questions;
  }

  private generateBotAnswers(questions: Question[]): Record<string, number> {
    const answers: Record<string, number> = {};
    // Slightly varied random answers compatible with the active question pack
    for (const q of questions) {
      if (q.type === "scale") {
        answers[q.id] = Math.floor(Math.random() * 5) + 1; // 1..5
      } else {
        const optionCount = q.options?.length ?? 4;
        answers[q.id] = Math.floor(Math.random() * optionCount); // 0..3
      }
    }
    return answers;
  }

  public createRoom(params: {
    socketId: string;
    hostName: string;
    avatar: string;
    spottingClue: string;
    hostParticipates: boolean;
    revealWorstEnemy?: boolean;
  }): { room: Room; hostPlayer: Player } {
    const code = this.generateRoomCode();
    const hostToken = crypto.randomUUID();
    const playerId = crypto.randomUUID();

    const hostPlayer: Player = {
      id: playerId,
      socketId: params.socketId,
      name: params.hostName.trim().slice(0, 24) || "Host",
      avatar: params.avatar || "✨",
      spottingClue: (params.spottingClue || "").trim().slice(0, 80),
      isHost: true,
      isBot: false,
      connected: true,
      answers: {},
      quizCompleted: false,
    };

    const room: Room = {
      code,
      hostToken,
      hostParticipates: Boolean(params.hostParticipates),
      revealWorstEnemy: Boolean(params.revealWorstEnemy),
      selectedPackId: DEFAULT_PACK_ID,
      phase: "LOBBY",
      players: new Map([[playerId, hostPlayer]]),
      matches: [],
      worstEnemies: new Map(),
      revealAt: null,
      lastActiveAt: Date.now(),
    };

    this.rooms.set(code, room);
    this.socketIndex.set(params.socketId, { roomCode: code, playerId });
    return { room, hostPlayer };
  }

  public joinRoom(params: {
    roomCode: string;
    socketId: string;
    name: string;
    avatar: string;
    spottingClue: string;
  }): { room: Room; player: Player } {
    const code = params.roomCode.trim().toUpperCase();
    const room = this.rooms.get(code);
    if (!room) {
      throw new Error(`Room "${code}" not found. Double-check the 4-letter code!`);
    }
    if (room.phase !== "LOBBY" && room.phase !== "QUIZ") {
      throw new Error(
        "This room has already matched! Ask the host to start a fresh round."
      );
    }

    const playerId = crypto.randomUUID();
    const player: Player = {
      id: playerId,
      socketId: params.socketId,
      name: params.name.trim().slice(0, 24) || "Guest",
      avatar: params.avatar || "🎉",
      spottingClue: (params.spottingClue || "").trim().slice(0, 80),
      isHost: false,
      isBot: false,
      connected: true,
      answers: {},
      quizCompleted: false,
    };

    room.players.set(playerId, player);
    room.lastActiveAt = Date.now();
    this.socketIndex.set(params.socketId, { roomCode: code, playerId });

    return { room, player };
  }

  public reconnectPlayer(params: {
    roomCode: string;
    playerId: string;
    hostToken?: string;
    socketId: string;
  }): {
    room: Room;
    player: Player;
    isHostVerified: boolean;
    playerMatch?: ReconnectMatchState;
  } {
    const code = params.roomCode.trim().toUpperCase();
    const room = this.rooms.get(code);
    if (!room) {
      throw new Error("Room no longer exists.");
    }
    const player = room.players.get(params.playerId);
    if (!player) {
      throw new Error("Player session not found in this room.");
    }

    if (player.socketId && player.socketId !== params.socketId) {
      this.socketIndex.delete(player.socketId);
    }
    player.socketId = params.socketId;
    player.connected = true;
    room.lastActiveAt = Date.now();
    this.socketIndex.set(params.socketId, { roomCode: code, playerId: player.id });

    const isHostVerified = Boolean(
      player.isHost && params.hostToken && params.hostToken === room.hostToken
    );

    let playerMatch: ReconnectMatchState | undefined;
    if (room.phase === "CLUES" || room.phase === "REVEAL") {
      const group = room.matches.find((m) => m.playerIds.includes(player.id));
      if (group) {
        const partnerClues = this.getPartnerCluesForPlayer(room, group, player.id);
        playerMatch = { partnerClues };
        if (room.phase === "REVEAL" && room.revealAt !== null) {
          playerMatch.revealPayload = this.buildRevealPayload(
            room,
            group,
            player.id
          );
        }
      }
    }

    return { room, player, isHostVerified, playerMatch };
  }

  public handleDisconnect(socketId: string): Room | null {
    const entry = this.socketIndex.get(socketId);
    if (!entry) return null;
    this.socketIndex.delete(socketId);

    const room = this.rooms.get(entry.roomCode);
    if (!room) return null;

    const player = room.players.get(entry.playerId);
    if (player && player.socketId === socketId) {
      player.connected = false;
      player.socketId = null;
      room.lastActiveAt = Date.now();
    }

    return room;
  }

  private assertHost(roomCode: string, hostToken: string): Room {
    const room = this.rooms.get(roomCode.trim().toUpperCase());
    if (!room) {
      throw new Error("Room not found.");
    }
    if (!hostToken || room.hostToken !== hostToken) {
      throw new Error("Unauthorized host action.");
    }
    room.lastActiveAt = Date.now();
    return room;
  }

  public toggleHostParticipate(
    roomCode: string,
    hostToken: string,
    hostParticipates: boolean
  ): Room {
    const room = this.assertHost(roomCode, hostToken);
    if (room.phase !== "LOBBY" && room.phase !== "QUIZ") {
      throw new Error("Cannot change host participation after matching.");
    }
    room.hostParticipates = Boolean(hostParticipates);
    return room;
  }

  public toggleRevealWorstEnemy(
    roomCode: string,
    hostToken: string,
    revealWorstEnemy: boolean
  ): Room {
    const room = this.assertHost(roomCode, hostToken);
    if (room.phase === "REVEAL") {
      throw new Error("Cannot change Worst Enemy reveal after reveal started.");
    }
    room.revealWorstEnemy = Boolean(revealWorstEnemy);
    return room;
  }

  public selectPack(
    roomCode: string,
    hostToken: string,
    packId: string
  ): Room {
    const room = this.assertHost(roomCode, hostToken);
    if (room.phase !== "LOBBY") {
      throw new Error("Cannot change the question pack after the quiz starts.");
    }
    const pack = getQuestionPack(packId);
    if (!pack) {
      throw new Error(`Unknown question pack "${packId}".`);
    }
    room.selectedPackId = pack.id;

    // Refresh any existing lobby bots so their answers match the active pack
    for (const player of room.players.values()) {
      if (player.isBot) {
        player.answers = this.generateBotAnswers(pack.questions);
      }
    }

    return room;
  }

  public kickPlayer(
    roomCode: string,
    hostToken: string,
    targetPlayerId: string
  ): { room: Room; kickedSocketId: string | null } {
    const room = this.assertHost(roomCode, hostToken);
    const target = room.players.get(targetPlayerId);
    if (!target) {
      throw new Error("Player not found.");
    }
    if (target.isHost) {
      throw new Error("Host cannot kick themselves.");
    }

    const kickedSocketId = target.socketId;
    if (kickedSocketId) {
      this.socketIndex.delete(kickedSocketId);
    }
    room.players.delete(targetPlayerId);
    return { room, kickedSocketId };
  }

  public addBots(roomCode: string, hostToken: string, count = 5): {
    room: Room;
    addedCount: number;
  } {
    const room = this.assertHost(roomCode, hostToken);
    if (room.phase !== "LOBBY" && room.phase !== "QUIZ") {
      throw new Error("Reset the room before adding more bots.");
    }

    const safeCount = Math.max(1, Math.min(20, Math.floor(count || 5)));
    const existingNames = new Set(
      Array.from(room.players.values()).map((p) => p.name.toLowerCase())
    );

    const available = BOT_PROFILES.filter(
      (b) => !existingNames.has(b.name.toLowerCase())
    );

    const activeQuestions = this.getRoomQuestions(room);

    let added = 0;
    for (let i = 0; i < safeCount; i++) {
      if (room.players.size >= 60) break;

      const template = available[i] ?? {
        name: `Bot ${room.players.size + 1}`,
        avatar: "🤖",
        clue: "hiding behind a potted plant",
      };

      const botId = crypto.randomUUID();
      const answers = this.generateBotAnswers(activeQuestions);
      const bot: Player = {
        id: botId,
        socketId: null,
        name: template.name,
        avatar: template.avatar,
        spottingClue: template.clue,
        isHost: false,
        isBot: true,
        connected: true,
        answers,
        quizCompleted: room.phase === "QUIZ",
      };
      room.players.set(botId, bot);
      added += 1;
    }

    return { room, addedCount: added };
  }

  public getParticipatingPlayers(room: Room): Player[] {
    return Array.from(room.players.values()).filter(
      (p) => !p.isHost || room.hostParticipates
    );
  }

  public startQuiz(roomCode: string, hostToken: string): Room {
    const room = this.assertHost(roomCode, hostToken);
    const participants = this.getParticipatingPlayers(room);
    if (participants.length < 2) {
      throw new Error(
        "Need at least 2 participating players to start! Add test bots or invite a friend."
      );
    }

    room.phase = "QUIZ";
    room.matches = [];
    room.worstEnemies = new Map();
    room.revealAt = null;

    const activeQuestions = this.getRoomQuestions(room);
    // Bots immediately complete the quiz with varied randomized answers for the active pack
    for (const player of room.players.values()) {
      if (player.isBot) {
        const hasAllActiveAnswers = activeQuestions.every(
          (q) => typeof player.answers[q.id] === "number"
        );
        if (!hasAllActiveAnswers) {
          player.answers = this.generateBotAnswers(activeQuestions);
        }
        player.quizCompleted = true;
      }
    }

    return room;
  }

  public submitAnswers(
    roomCode: string,
    playerId: string,
    answers: Record<string, number>
  ): Room {
    const room = this.rooms.get(roomCode.trim().toUpperCase());
    if (!room) {
      throw new Error("Room not found.");
    }
    const player = room.players.get(playerId);
    if (!player) {
      throw new Error("Player not found in room.");
    }

    const activeQuestions = this.getRoomQuestions(room);
    const sanitized: Record<string, number> = {};
    for (const q of activeQuestions) {
      const val = answers[q.id];
      if (typeof val !== "number" || Number.isNaN(val)) {
        throw new Error(`Missing answer for question ${q.id}`);
      }
      if (q.type === "scale") {
        sanitized[q.id] = Math.max(1, Math.min(5, Math.round(val)));
      } else {
        const maxIdx = (q.options?.length ?? 4) - 1;
        sanitized[q.id] = Math.max(0, Math.min(maxIdx, Math.round(val)));
      }
    }

    player.answers = sanitized;
    player.quizCompleted = true;
    room.lastActiveAt = Date.now();
    return room;
  }

  public calculateMatches(
    roomCode: string,
    hostToken: string
  ): { room: Room; matchCount: number; hasTrio: boolean } {
    const room = this.assertHost(roomCode, hostToken);
    const completed = this.getParticipatingPlayers(room).filter(
      (p) => p.quizCompleted
    );

    if (completed.length < 2) {
      throw new Error(
        "At least 2 participating players must finish the quiz before matching!"
      );
    }

    const activeQuestions = this.getRoomQuestions(room);
    room.matches = computeRoomMatches(completed, activeQuestions);
    room.worstEnemies = computeWorstEnemies(
      completed,
      activeQuestions,
      room.matches
    );
    room.phase = "MATCHED";
    room.revealAt = null;

    return {
      room,
      matchCount: room.matches.length,
      hasTrio: room.matches.some((m) => m.playerIds.length === 3),
    };
  }

  public getPartnerCluesForPlayer(
    room: Room,
    group: MatchGroup,
    playerId: string
  ): string[] {
    return group.playerIds
      .filter((id) => id !== playerId)
      .map((id) => {
        const partner = room.players.get(id);
        const clue = partner?.spottingClue?.trim();
        return clue && clue.length > 0
          ? clue
          : "A mysterious guest who left no spotting clue 👀";
      });
  }

  public buildRevealPayload(
    room: Room,
    group: MatchGroup,
    playerId: string
  ): RevealPayload {
    const partners: PartnerProfile[] = group.playerIds
      .filter((id) => id !== playerId)
      .map((id) => {
        const p = room.players.get(id);
        return {
          id,
          name: p?.name ?? "Mystery Guest",
          avatar: p?.avatar ?? "✨",
          spottingClue: p?.spottingClue ?? "",
        };
      });

    let worstEnemy: WorstEnemyReveal | undefined;
    if (room.revealWorstEnemy) {
      const enemyInfo = room.worstEnemies.get(playerId);
      if (enemyInfo) {
        const enemyPlayer = room.players.get(enemyInfo.enemyId);
        if (enemyPlayer) {
          worstEnemy = {
            enemy: {
              id: enemyPlayer.id,
              name: enemyPlayer.name,
              avatar: enemyPlayer.avatar,
              spottingClue: enemyPlayer.spottingClue,
            },
            compatibility: enemyInfo.compatibility,
            biggestClash: enemyInfo.biggestClash,
          };
        }
      }
    }

    return {
      revealAt: room.revealAt ?? Date.now(),
      serverNow: Date.now(),
      match: group,
      partners,
      ...(worstEnemy ? { worstEnemy } : {}),
    };
  }

  public triggerClues(
    roomCode: string,
    hostToken: string
  ): {
    room: Room;
    deliveries: Array<{ socketId: string; partnerClues: string[] }>;
  } {
    const room = this.assertHost(roomCode, hostToken);
    if (room.matches.length === 0) {
      throw new Error("Calculate matches first before sending clues.");
    }

    room.phase = "CLUES";
    const deliveries: Array<{ socketId: string; partnerClues: string[] }> = [];

    for (const group of room.matches) {
      for (const playerId of group.playerIds) {
        const player = room.players.get(playerId);
        if (player?.socketId) {
          deliveries.push({
            socketId: player.socketId,
            partnerClues: this.getPartnerCluesForPlayer(room, group, playerId),
          });
        }
      }
    }

    return { room, deliveries };
  }

  public triggerReveal(
    roomCode: string,
    hostToken: string
  ): {
    room: Room;
    deliveries: Array<{ socketId: string; payload: RevealPayload }>;
  } {
    const room = this.assertHost(roomCode, hostToken);
    if (room.matches.length === 0) {
      throw new Error("Calculate matches first before triggering the reveal.");
    }

    room.phase = "REVEAL";
    room.revealAt = Date.now() + 10_000;

    const deliveries: Array<{ socketId: string; payload: RevealPayload }> = [];

    for (const group of room.matches) {
      for (const playerId of group.playerIds) {
        const player = room.players.get(playerId);
        if (player?.socketId) {
          deliveries.push({
            socketId: player.socketId,
            payload: this.buildRevealPayload(room, group, playerId),
          });
        }
      }
    }

    return { room, deliveries };
  }

  public resetRoom(roomCode: string, hostToken: string): Room {
    const room = this.assertHost(roomCode, hostToken);
    room.phase = "LOBBY";
    room.matches = [];
    room.worstEnemies = new Map();
    room.revealAt = null;

    const activeQuestions = this.getRoomQuestions(room);
    for (const player of room.players.values()) {
      player.quizCompleted = false;
      player.answers = player.isBot
        ? this.generateBotAnswers(activeQuestions)
        : {};
    }

    return room;
  }

  public serializePublicState(room: Room): PublicRoomState {
    const players: PublicPlayer[] = Array.from(room.players.values()).map(
      (p) => ({
        id: p.id,
        name: p.name,
        avatar: p.avatar,
        spottingClue: p.spottingClue,
        isHost: p.isHost,
        isBot: p.isBot,
        connected: p.connected,
        quizCompleted: p.quizCompleted,
      })
    );

    const participating = this.getParticipatingPlayers(room);
    const completedCount = participating.filter((p) => p.quizCompleted).length;
    const activePack = getQuestionPackOrDefault(room.selectedPackId);

    return {
      code: room.code,
      phase: room.phase,
      hostParticipates: room.hostParticipates,
      revealWorstEnemy: room.revealWorstEnemy,
      selectedPackId: activePack.id,
      selectedPack: toPackMeta(activePack),
      availablePacks: getPublicPackMetas(),
      players,
      participatingCount: participating.length,
      completedCount,
      matchCount: room.matches.length,
      hasTrio: room.matches.some((m) => m.playerIds.length === 3),
      revealAt: room.revealAt,
      serverNow: Date.now(),
    };
  }
}
