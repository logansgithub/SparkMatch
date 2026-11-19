import React, { useEffect, useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import {
  Bot,
  Check,
  CheckCircle2,
  Copy,
  Eye,
  LogOut,
  Play,
  QrCode,
  RotateCcw,
  Skull,
  Sparkles,
  Timer,
  Trash2,
  Users,
  Wand2,
} from "lucide-react";
import { PublicPlayer, PublicRoomState } from "../types";

interface HostDashboardProps {
  roomState: PublicRoomState;
  me: PublicPlayer | undefined;
  onToggleParticipate: (val: boolean) => Promise<void>;
  onToggleWorstEnemy: (val: boolean) => Promise<void>;
  onAddBots: (count?: number) => Promise<void>;
  onKickPlayer: (targetPlayerId: string) => Promise<void>;
  onStartQuiz: () => Promise<void>;
  onCalculateMatches: () => Promise<void>;
  onSendClues: () => Promise<void>;
  onTriggerReveal: () => Promise<void>;
  onResetRoom: () => Promise<void>;
  onLeaveRoom: () => void;
  onOpenMyPlayerView?: () => void;
  hasPersonalView: boolean;
}

const PHASES: Array<{ id: PublicRoomState["phase"]; label: string }> = [
  { id: "LOBBY", label: "Lobby" },
  { id: "QUIZ", label: "Quiz" },
  { id: "MATCHED", label: "Matched" },
  { id: "CLUES", label: "Clues" },
  { id: "REVEAL", label: "Reveal" },
];

export const HostDashboard: React.FC<HostDashboardProps> = ({
  roomState,
  me,
  onToggleParticipate,
  onToggleWorstEnemy,
  onAddBots,
  onKickPlayer,
  onStartQuiz,
  onCalculateMatches,
  onSendClues,
  onTriggerReveal,
  onResetRoom,
  onLeaveRoom,
  onOpenMyPlayerView,
  hasPersonalView,
}) => {
  const [copied, setCopied] = useState(false);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const inviteUrl = `${window.location.origin}/join/${roomState.code}`;

  const clockOffset = useMemo(
    () => roomState.serverNow - Date.now(),
    [roomState.serverNow]
  );
  const [countdownSec, setCountdownSec] = useState<number>(0);

  useEffect(() => {
    if (roomState.phase !== "REVEAL" || !roomState.revealAt) {
      setCountdownSec(0);
      return;
    }
    const update = () => {
      const rem = Math.max(
        0,
        roomState.revealAt! - (Date.now() + clockOffset)
      );
      setCountdownSec(Math.ceil(rem / 1000));
    };
    update();
    const timer = window.setInterval(update, 150);
    return () => window.clearInterval(timer);
  }, [roomState.phase, roomState.revealAt, clockOffset]);

  const handleCopyInvite = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
    } catch {
      const input = document.createElement("input");
      input.value = inviteUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
    }
    setCopied(true);
    toast.success("Invite link copied to clipboard");
    window.setTimeout(() => setCopied(false), 2000);
  };

  const runAction = async (key: string, fn: () => Promise<void>) => {
    setBusyAction(key);
    try {
      await fn();
    } finally {
      setBusyAction(null);
    }
  };

  const currentPhaseIdx = PHASES.findIndex((p) => p.id === roomState.phase);
  const quizProgressPct =
    roomState.participatingCount > 0
      ? Math.round(
          (roomState.completedCount / roomState.participatingCount) * 100
        )
      : 0;

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 space-y-5">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-baseline gap-2.5">
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold leading-none text-[#F5F4F0]">
            Spark<span className="text-[#FF5C38]">Match</span>
          </h1>
          <span className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">
            Host Deck
          </span>
        </div>

        <div className="flex items-center gap-2">
          {hasPersonalView && onOpenMyPlayerView && (
            <button
              type="button"
              onClick={onOpenMyPlayerView}
              className="editorial-btn-amber text-xs sm:text-sm min-h-[48px] py-2 px-3.5"
            >
              <Sparkles className="w-4 h-4" />
              {roomState.phase === "QUIZ" && !me?.quizCompleted
                ? "Take My Quiz"
                : "My Card"}
            </button>
          )}
          <div className="min-h-[48px] px-3.5 rounded-xl bg-[#1A1A1E] border border-white/[0.1] flex items-center gap-2 text-xs font-bold text-zinc-400">
            <span>CODE</span>
            <span className="font-display font-extrabold text-base tracking-[0.2em] text-[#FF5C38]">
              {roomState.code}
            </span>
          </div>
          <button
            type="button"
            onClick={onLeaveRoom}
            className="editorial-btn-ghost px-3"
            aria-label="Exit room"
            title="Exit room"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Phase Stepper */}
      <div className="editorial-card p-2">
        <div className="grid grid-cols-5 gap-1.5 text-center">
          {PHASES.map((step, idx) => {
            const active = idx === currentPhaseIdx;
            const done = idx < currentPhaseIdx;
            return (
              <div
                key={step.id}
                className={`py-2.5 px-1 rounded-xl font-sans font-bold text-xs tracking-wide transition-all ${
                  active
                    ? "bg-[#FF5C38] text-[#121214]"
                    : done
                    ? "bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/25"
                    : "bg-[#121214]/70 text-zinc-500 border border-white/[0.04]"
                }`}
              >
                {step.label}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
        {/* Left Column: QR Invite + Game Controls */}
        <div className="md:col-span-5 space-y-5">
          {/* QR Invite Card */}
          <div className="editorial-card p-6 text-center space-y-4">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-400">
              <QrCode className="w-3.5 h-3.5 text-[#FF5C38]" />
              Scan to Join Party
            </div>

            <div className="inline-block p-3.5 bg-[#F5F4F0] rounded-2xl shadow-editorial-sm">
              <QRCodeSVG
                value={inviteUrl}
                size={184}
                bgColor="#F5F4F0"
                fgColor="#121214"
                level="M"
              />
            </div>

            <div>
              <div className="text-3xl font-display font-extrabold tracking-[0.24em] text-[#F5F4F0]">
                {roomState.code}
              </div>
              <div
                className="text-xs text-zinc-500 truncate mt-1 font-mono"
                title={inviteUrl}
              >
                {inviteUrl}
              </div>
            </div>

            <button
              type="button"
              onClick={handleCopyInvite}
              className="editorial-btn-secondary w-full text-sm"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  Copied Invite Link
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-zinc-300" />
                  Copy Invite Link
                </>
              )}
            </button>
          </div>

          {/* Host Controls Card */}
          <div className="editorial-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-display font-bold text-[#F5F4F0]">
                Game Controls
              </h2>
              <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-[#121214] border border-white/[0.1] text-zinc-300">
                {roomState.phase}
              </span>
            </div>

            {(roomState.phase === "LOBBY" || roomState.phase === "QUIZ") && (
              <label className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-[#121214] border border-white/[0.08] hover:border-white/20 transition-colors cursor-pointer min-h-[56px]">
                <div>
                  <div className="text-sm font-semibold text-[#F5F4F0]">
                    Include Host in Matching
                  </div>
                  <div className="text-xs text-zinc-400 mt-0.5">
                    {roomState.hostParticipates
                      ? "You will take the quiz and get matched"
                      : "Spectator / MC mode only"}
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={roomState.hostParticipates}
                  onChange={(e) =>
                    runAction("toggle", () =>
                      onToggleParticipate(e.target.checked)
                    )
                  }
                  disabled={busyAction !== null}
                  className="w-4 h-4 accent-[#FF5C38] cursor-pointer shrink-0"
                />
              </label>
            )}

            {roomState.phase !== "REVEAL" && (
              <label className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-[#121214] border border-white/[0.08] hover:border-white/20 transition-colors cursor-pointer min-h-[56px]">
                <div>
                  <div className="text-sm font-semibold text-[#F5F4F0] flex items-center gap-1.5">
                    <Skull className="w-3.5 h-3.5 text-[#F59E0B]" />
                    Also Reveal Worst Enemy
                  </div>
                  <div className="text-xs text-zinc-400 mt-0.5">
                    {roomState.revealWorstEnemy
                      ? "Players will also see their least similar nemesis"
                      : "Off — reveal closest match only"}
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={roomState.revealWorstEnemy}
                  onChange={(e) =>
                    runAction("toggle-enemy", () =>
                      onToggleWorstEnemy(e.target.checked)
                    )
                  }
                  disabled={busyAction !== null}
                  className="w-4 h-4 accent-[#F59E0B] cursor-pointer shrink-0"
                />
              </label>
            )}

            {/* LOBBY ACTIONS */}
            {roomState.phase === "LOBBY" && (
              <div className="space-y-3 pt-1">
                <button
                  type="button"
                  onClick={() => runAction("bots", () => onAddBots(5))}
                  disabled={busyAction !== null}
                  className="editorial-btn-secondary w-full text-sm"
                >
                  <Bot className="w-4 h-4 text-[#F59E0B]" />
                  {busyAction === "bots"
                    ? "Adding Bots..."
                    : "Add Test Bots (+5)"}
                </button>
                <button
                  type="button"
                  onClick={() => runAction("start", onStartQuiz)}
                  disabled={
                    busyAction !== null || roomState.participatingCount < 2
                  }
                  className="editorial-btn-primary w-full"
                >
                  <Play className="w-4 h-4 fill-current" />
                  {busyAction === "start"
                    ? "Starting..."
                    : `Start Quiz (${roomState.participatingCount} Players)`}
                </button>
                {roomState.participatingCount < 2 && (
                  <p className="text-xs text-zinc-500 text-center">
                    Need at least 2 participating players to start.
                  </p>
                )}
              </div>
            )}

            {/* QUIZ ACTIONS */}
            {roomState.phase === "QUIZ" && (
              <div className="space-y-3 pt-1">
                <div className="editorial-subcard p-4 space-y-2.5">
                  <div className="flex justify-between text-xs font-bold tabular-nums">
                    <span className="text-zinc-400 uppercase tracking-wider">
                      Quiz Submissions
                    </span>
                    <span className="text-[#F5F4F0]">
                      {roomState.completedCount} / {roomState.participatingCount}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#1A1A1E] overflow-hidden">
                    <div
                      className="h-full bg-[#FF5C38] rounded-full transition-all duration-300"
                      style={{ width: `${quizProgressPct}%` }}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => runAction("match", onCalculateMatches)}
                  disabled={busyAction !== null || roomState.completedCount < 2}
                  className="editorial-btn-primary w-full"
                >
                  <Wand2 className="w-4 h-4" />
                  {busyAction === "match"
                    ? "Calculating Matches..."
                    : "Calculate Matches"}
                </button>
              </div>
            )}

            {/* MATCHED & CLUES ACTIONS */}
            {(roomState.phase === "MATCHED" || roomState.phase === "CLUES") && (
              <div className="space-y-3 pt-1">
                <div className="p-3.5 rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/30 text-sm font-semibold text-[#F59E0B] text-center flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4 shrink-0" />
                  <span>
                    {roomState.matchCount} Optimal Match{" "}
                    {roomState.matchCount === 1 ? "Group" : "Groups"} Ready
                    {roomState.hasTrio ? " (includes 1 Power Trio)" : ""}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => runAction("clues", onSendClues)}
                  disabled={busyAction !== null}
                  className="editorial-btn-secondary w-full text-sm"
                >
                  <Eye className="w-4 h-4 text-[#F59E0B]" />
                  {roomState.phase === "CLUES"
                    ? "Resend Spotting Clues"
                    : "Send Spotting Clues (Teaser)"}
                </button>

                <button
                  type="button"
                  onClick={() => runAction("reveal", onTriggerReveal)}
                  disabled={busyAction !== null}
                  className="editorial-btn-primary w-full"
                >
                  <Timer className="w-4 h-4" />
                  Start 10s Synced Reveal
                </button>
              </div>
            )}

            {/* REVEAL PHASE */}
            {roomState.phase === "REVEAL" && (
              <div className="space-y-4 pt-1">
                <div className="p-6 rounded-2xl bg-[#121214] border border-white/[0.1] text-center space-y-2">
                  {countdownSec > 0 ? (
                    <>
                      <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#F59E0B]">
                        Live Synced Countdown
                      </div>
                      <div className="font-display font-black text-7xl tracking-tighter tabular-nums text-[#FF5C38]">
                        {countdownSec}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-12 h-12 mx-auto rounded-xl bg-[#FF5C38]/15 border border-[#FF5C38]/30 text-[#FF5C38] flex items-center justify-center">
                        <Sparkles className="w-6 h-6" />
                      </div>
                      <div className="text-xl font-display font-extrabold text-[#F5F4F0] pt-1">
                        Matches Revealed
                      </div>
                      <p className="text-xs text-zinc-400">
                        Every phone has flipped its collectible match card.
                      </p>
                    </>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => runAction("reset", onResetRoom)}
                  disabled={busyAction !== null}
                  className="editorial-btn-secondary w-full text-sm"
                >
                  <RotateCcw className="w-4 h-4" />
                  Play Another Round
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Live Player Roster */}
        <div className="md:col-span-7 editorial-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-[#FF5C38]" />
              <h2 className="text-lg font-display font-bold text-[#F5F4F0]">
                Party Roster ({roomState.players.length})
              </h2>
            </div>
            <span className="text-xs font-semibold text-zinc-400 tabular-nums">
              {roomState.participatingCount} matching
            </span>
          </div>

          <div className="divide-y divide-white/[0.07] max-h-[540px] overflow-y-auto pr-1">
            {roomState.players.map((p) => {
              const isParticipating = !p.isHost || roomState.hostParticipates;
              return (
                <div
                  key={p.id}
                  className="py-3 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative w-11 h-11 shrink-0 rounded-xl bg-[#121214] border border-white/[0.1] flex items-center justify-center text-2xl">
                      {p.avatar}
                      <span
                        title={p.connected ? "Connected" : "Reconnecting"}
                        className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#1A1A1E] ${
                          p.connected ? "bg-emerald-400" : "bg-[#FF5C38]"
                        }`}
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-sm sm:text-base text-[#F5F4F0] truncate">
                          {p.name}
                        </span>
                        {p.isHost && (
                          <span className="px-1.5 py-0.5 rounded bg-[#FF5C38]/15 border border-[#FF5C38]/30 text-[#FF5C38] text-[10px] font-bold uppercase tracking-wider">
                            Host
                          </span>
                        )}
                        {p.isBot && (
                          <span className="px-1.5 py-0.5 rounded bg-[#F59E0B]/15 border border-[#F59E0B]/30 text-[#F59E0B] text-[10px] font-bold uppercase tracking-wider">
                            Bot
                          </span>
                        )}
                        {!isParticipating && (
                          <span className="px-1.5 py-0.5 rounded bg-white/[0.06] text-zinc-400 text-[10px] font-bold uppercase tracking-wider">
                            MC
                          </span>
                        )}
                      </div>
                      {p.spottingClue && (
                        <div className="text-xs text-zinc-400 truncate mt-0.5">
                          “{p.spottingClue}”
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isParticipating && roomState.phase !== "LOBBY" && (
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-semibold ${
                          p.quizCompleted
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                            : "bg-[#121214] border-white/[0.08] text-zinc-500"
                        }`}
                      >
                        {p.quizCompleted ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Done
                          </>
                        ) : (
                          "Answering..."
                        )}
                      </span>
                    )}

                    {!p.isHost && (
                      <button
                        type="button"
                        onClick={() =>
                          runAction(`kick-${p.id}`, () => onKickPlayer(p.id))
                        }
                        title={`Remove ${p.name}`}
                        aria-label={`Remove ${p.name}`}
                        className="w-10 h-10 rounded-xl border border-white/[0.08] hover:border-[#FF5C38]/50 hover:bg-[#FF5C38]/10 text-zinc-500 hover:text-[#FF5C38] flex items-center justify-center transition-colors active:scale-95"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
