export type QuestionType = "scale" | "choice";

export interface Question {
  id: string;
  type: QuestionType;
  prompt: string;
  lowLabel?: string;
  highLabel?: string;
  options?: string[];
  topicTag: string;
}

export interface MatchInsight {
  questionId: string;
  topicTag: string;
  description: string;
  rarityScore: number;
}

export interface MatchGroup {
  playerIds: string[];
  compatibility: number;
  sharedHighlights: MatchInsight[];
  spicyDifference: MatchInsight;
}

export type RoomPhase = "LOBBY" | "QUIZ" | "MATCHED" | "CLUES" | "REVEAL";

export interface PublicPlayer {
  id: string;
  name: string;
  avatar: string;
  spottingClue: string;
  isHost: boolean;
  isBot: boolean;
  connected: boolean;
  quizCompleted: boolean;
}

export interface QuestionPackMeta {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  accentColor: string;
  description: string;
  questionCount: number;
}

export interface PublicRoomState {
  code: string;
  phase: RoomPhase;
  hostParticipates: boolean;
  revealWorstEnemy: boolean;
  selectedPackId: string;
  selectedPack: QuestionPackMeta;
  availablePacks: QuestionPackMeta[];
  players: PublicPlayer[];
  participatingCount: number;
  completedCount: number;
  matchCount: number;
  hasTrio: boolean;
  revealAt: number | null;
  serverNow: number;
}

export interface PartnerProfile {
  id: string;
  name: string;
  avatar: string;
  spottingClue: string;
}

export interface WorstEnemyReveal {
  enemy: PartnerProfile;
  compatibility: number;
  biggestClash: MatchInsight;
}

export interface RevealPayload {
  revealAt: number;
  serverNow: number;
  match: MatchGroup;
  partners: PartnerProfile[];
  worstEnemy?: WorstEnemyReveal;
}

export interface ReconnectMatchState {
  partnerClues: string[];
  revealPayload?: RevealPayload;
}

export interface StoredSession {
  roomCode: string;
  playerId: string;
  hostToken?: string;
}

export const AVATAR_OPTIONS = [
  "🦊",
  "🪩",
  "🐙",
  "🦖",
  "⚡",
  "🦋",
  "🍒",
  "🪐",
  "🔥",
  "🌈",
  "🍄",
  "🚀",
  "🌻",
  "🎧",
  "🦄",
  "🐝",
];
