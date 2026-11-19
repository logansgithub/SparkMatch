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
  // Short tag used for insight cards:
  topicTag: string;
}

export interface QuestionPack {
  id: string;
  title: string;
  subtitle: string;
  icon: string; // Lucide icon name or emoji
  accentColor: string; // Hex or Tailwind accent
  description: string;
  questions: Question[];
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

export interface Player {
  id: string;
  socketId: string | null;
  name: string;
  avatar: string; // Emoji avatar
  spottingClue: string; // Optional 1-line hint, e.g., "wearing red sneakers"
  isHost: boolean;
  isBot: boolean;
  connected: boolean;
  answers: Record<string, number>; // questionId -> numeric answer
  quizCompleted: boolean;
}

export interface MatchInsight {
  questionId: string;
  topicTag: string;
  description: string; // Human-readable explanation
  rarityScore: number; // Higher = rarer shared answer in this room
}

export interface MatchGroup {
  playerIds: string[]; // Length 2 (pair) or 3 (trio for odd counts)
  compatibility: number; // 0 to 100 integer
  sharedHighlights: MatchInsight[]; // Top 2 rarest shared answers
  spicyDifference: MatchInsight; // Largest playful disagreement
}

export interface WorstEnemyInfo {
  enemyId: string;
  compatibility: number; // 0 to 100 integer
  biggestClash: MatchInsight;
}

export type RoomPhase = "LOBBY" | "QUIZ" | "MATCHED" | "CLUES" | "REVEAL";

export interface Room {
  code: string; // 4 uppercase letters (no ambiguous chars like O/I)
  hostToken: string; // Secret UUID for authenticating host actions
  hostParticipates: boolean;
  revealWorstEnemy: boolean;
  selectedPackId: string;
  phase: RoomPhase;
  players: Map<string, Player>;
  matches: MatchGroup[];
  worstEnemies: Map<string, WorstEnemyInfo>; // playerId -> least similar player
  revealAt: number | null; // Absolute UTC timestamp (ms)
  lastActiveAt: number;
}

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
