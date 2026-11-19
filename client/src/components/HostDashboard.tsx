import React, { useEffect, useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  Bot,
  Briefcase,
  Check,
  CheckCircle2,
  Compass,
  Copy,
  Eye,
  Flame,
  Layers,
  Moon,
  Play,
  RotateCcw,
  Sparkles,
  Timer,
  Trash2,
  Users,
  Wand2,
} from "lucide-react";
import { PublicPlayer, PublicRoomState } from "../types";

function renderPackIcon(iconName: string, className = "w-4 h-4") {
  switch (iconName) {
    case "Briefcase":
      return <Briefcase className={className} />;
    case "Moon":
      return <Moon className={className} />;
    case "Compass":
      return <Compass className={className} />;
    case "Flame":
    default:
      return <Flame className={className} />;
  }
}

interface HostDashboardProps {
  roomState: PublicRoomState;
  me: PublicPlayer | undefined;
  onToggleParticipate: (val: boolean) => Promise<void>;
  onToggleWorstEnemy: (val: boolean) => Promise<void>;
  onSelectPack: (packId: string) => Promise<void>;
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
  error: string | null;
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
  onSelectPack,
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
  error,
}) => {
  const [copied, setCopied] = useState(false);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const inviteUrl = `${window.location.origin}/join/${roomState.code}`;

  // Synced countdown display on Host screen during REVEAL
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
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for restricted clipboard contexts
      const input = document.createElement("input");
      input.value = inviteUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
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

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 space-y-5">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold leading-none">
            Spark<span className="text-coral">Match</span>{" "}
            <span className="text-base font-bold text-ink/55">Host Deck</span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {hasPersonalView && onOpenMyPlayerView && (
            <button
              type="button"
              onClick={onOpenMyPlayerView}
              className="riso-btn-marigold text-sm min-h-[42px] py-2 px-3.5"
            >
              <Sparkles className="w-4 h-4" />
              {roomState.phase === "QUIZ" && !me?.quizCompleted
                ? "Take My Quiz"
                : "My Player Screen"}
            </button>
          )}
          <div className="px-3.5 py-2 rounded-xl bg-white border-2 border-ink shadow-riso-sm font-display font-bold text-sm">
            CODE:{" "}
            <span className="text-indigoParty tracking-widest text-base">
              {roomState.code}
            </span>
          </div>
          <button
            type="button"
            onClick={onLeaveRoom}
            className="text-xs font-display font-bold text-ink/55 hover:text-coral underline px-1"
          >
            Exit
          </button>
        </div>
      </div>

      {/* Phase Stepper */}
      <div className="riso-card p-3">
        <div className="grid grid-cols-5 gap-1.5 text-center">
          {PHASES.map((step, idx) => {
            const active = idx === currentPhaseIdx;
            const done = idx < currentPhaseIdx;
            return (
              <div
                key={step.id}
                className={`py-2 px-1 rounded-xl border-2 font-display font-bold text-xs transition-all ${
                  active
                    ? "bg-coral text-white border-ink shadow-riso-sm"
                    : done
                    ? "bg-marigold/60 text-ink border-ink"
                    : "bg-cream text-ink/45 border-ink/20"
                }`}
              >
                {step.label}
              </div>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-coral/15 border-2 border-coral text-ink text-sm font-semibold">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
        {/* Left Column: QR Invite + Game Controls */}
        <div className="md:col-span-5 space-y-5">
          {/* QR Invite Card */}
          <div className="riso-card p-5 text-center space-y-4">
            <div className="text-xs font-display font-bold uppercase tracking-wider text-ink/60">
              Scan to Join Party
            </div>
            <div className="inline-block p-4 bg-white border-2 border-ink rounded-2xl shadow-riso-sm">
              <QRCodeSVG
                value={inviteUrl}
                size={184}
                bgColor="#FFFFFF"
                fgColor="#1A1826"
                level="M"
              />
            </div>
            <div>
              <div className="text-3xl font-display font-bold tracking-[0.22em] text-ink">
                {roomState.code}
              </div>
              <div
                className="text-xs text-ink/60 truncate mt-1 font-mono"
                title={inviteUrl}
              >
                {inviteUrl}
              </div>
            </div>
            <button
              type="button"
              onClick={handleCopyInvite}
              className="riso-btn-white w-full text-sm"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-mint" />
                  Invite Link Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy Invite Link
                </>
              )}
            </button>
          </div>

          {/* Host Controls Card */}
          <div className="riso-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-display font-bold">Game Controls</h2>
              <span className="text-xs font-display font-bold px-2.5 py-0.5 rounded-full bg-cream border border-ink">
                {roomState.phase}
              </span>
            </div>

            {(roomState.phase === "LOBBY" || roomState.phase === "QUIZ") && (
              <label className="flex items-center justify-between gap-3 p-3 rounded-xl bg-cream border-2 border-ink cursor-pointer">
                <div>
                  <div className="text-sm font-display font-bold">
                    Include Host in Matching
                  </div>
                  <div className="text-xs text-ink/65">
                    {roomState.hostParticipates
                      ? "You will take the quiz & get matched"
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
                  className="w-5 h-5 accent-indigoParty cursor-pointer"
                />
              </label>
            )}

            {roomState.phase !== "REVEAL" && (
              <label className="flex items-center justify-between gap-3 p-3 rounded-xl bg-coral/10 border-2 border-ink cursor-pointer">
                <div>
                  <div className="text-sm font-display font-bold">
                    Also Reveal Worst Enemy 😈
                  </div>
                  <div className="text-xs text-ink/65">
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
                  className="w-5 h-5 accent-coral cursor-pointer"
                />
              </label>
            )}

            {/* LOBBY ACTIONS */}
            {roomState.phase === "LOBBY" && (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => runAction("bots", () => onAddBots(5))}
                  disabled={busyAction !== null}
                  className="riso-btn-white w-full text-sm"
                >
                  <Bot className="w-4 h-4" />
                  {busyAction === "bots" ? "Adding Bots..." : "Add Test Bots (+5)"}
                </button>
                <button
                  type="button"
                  onClick={() => runAction("start", onStartQuiz)}
                  disabled={
                    busyAction !== null || roomState.participatingCount < 2
                  }
                  className="riso-btn-coral w-full text-base"
                >
                  <Play className="w-5 h-5" />
                  {busyAction === "start"
                    ? "Starting..."
                    : `Start Quiz (${roomState.participatingCount} Players)`}
                </button>
                {roomState.participatingCount < 2 && (
                  <p className="text-xs text-ink/60 text-center">
                    Need at least 2 participating players to start.
                  </p>
                )}
              </div>
            )}

            {/* QUIZ ACTIONS */}
            {roomState.phase === "QUIZ" && (
              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-cream border-2 border-ink space-y-2">
                  <div className="flex justify-between text-xs font-display font-bold">
                    <span>Quiz Submissions</span>
                    <span>
                      {roomState.completedCount} / {roomState.participatingCount}
                    </span>
                  </div>
                  <div className="w-full h-3.5 rounded-full bg-white border-2 border-ink overflow-hidden">
                    <div
                      className="h-full bg-mint transition-all duration-300"
                      style={{
                        width: `${
                          roomState.participatingCount > 0
                            ? Math.round(
                                (roomState.completedCount /
                                  roomState.participatingCount) *
                                  100
                              )
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => runAction("match", onCalculateMatches)}
                  disabled={busyAction !== null || roomState.completedCount < 2}
                  className="riso-btn-indigo w-full text-base"
                >
                  <Wand2 className="w-5 h-5" />
                  {busyAction === "match"
                    ? "Calculating Optimal Matches..."
                    : "Calculate Matches"}
                </button>
              </div>
            )}

            {/* MATCHED & CLUES ACTIONS */}
            {(roomState.phase === "MATCHED" || roomState.phase === "CLUES") && (
              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-marigold/35 border-2 border-ink text-sm font-display font-bold text-center">
                  ✨ {roomState.matchCount} Optimal Match{" "}
                  {roomState.matchCount === 1 ? "Group" : "Groups"} Ready
                  {roomState.hasTrio ? " (includes 1 Power Trio!)" : ""}
                </div>

                <button
                  type="button"
                  onClick={() => runAction("clues", onSendClues)}
                  disabled={busyAction !== null}
                  className="riso-btn-marigold w-full text-sm"
                >
                  <Eye className="w-4 h-4" />
                  {roomState.phase === "CLUES"
                    ? "Resend Spotting Clues"
                    : "Send Spotting Clues (Teaser)"}
                </button>

                <button
                  type="button"
                  onClick={() => runAction("reveal", onTriggerReveal)}
                  disabled={busyAction !== null}
                  className="riso-btn-coral w-full text-base"
                >
                  <Timer className="w-5 h-5" />
                  Start 10s Synced Reveal!
                </button>
              </div>
            )}

            {/* REVEAL PHASE */}
            {roomState.phase === "REVEAL" && (
              <div className="space-y-4">
                <div className="p-5 rounded-2xl bg-ink text-cream border-2 border-ink text-center space-y-2">
                  {countdownSec > 0 ? (
                    <>
                      <div className="text-xs font-display font-bold uppercase tracking-wider text-marigold">
                        Countdown Live on Every Phone
                      </div>
                      <div className="text-6xl font-display font-bold text-coral">
                        {countdownSec}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-3xl">🎉</div>
                      <div className="text-xl font-display font-bold text-marigold">
                        Matches Revealed!
                      </div>
                      <p className="text-xs text-cream/80">
                        Everyone can now see their match card and spotting clue.
                      </p>
                    </>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => runAction("reset", onResetRoom)}
                  disabled={busyAction !== null}
                  className="riso-btn-white w-full text-sm"
                >
                  <RotateCcw className="w-4 h-4" />
                  Play Another Round
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Event Deck Selector + Live Player Roster */}
        <div className="md:col-span-7 space-y-5">
          {/* Event Deck Selector (Interactive in LOBBY, Locked Badge after Quiz Starts) */}
          {roomState.phase === "LOBBY" ? (
            <div className="riso-card p-5 space-y-3.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-coral" />
                  <h2 className="text-lg font-display font-bold">
                    Event Question Deck
                  </h2>
                </div>
                <span className="text-xs font-display font-bold text-ink/60">
                  Pick your vibe
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {roomState.availablePacks.map((pack) => {
                  const isSelected = pack.id === roomState.selectedPackId;
                  return (
                    <button
                      key={pack.id}
                      type="button"
                      disabled={busyAction !== null}
                      onClick={() =>
                        runAction(`pack-${pack.id}`, () => onSelectPack(pack.id))
                      }
                      aria-pressed={isSelected}
                      className={`text-left p-3.5 rounded-xl border-2 transition-all min-h-[96px] flex flex-col justify-between gap-2 ${
                        isSelected
                          ? "border-coral ring-2 ring-coral/40 bg-marigold/20 shadow-riso-sm"
                          : "border-ink/25 bg-cream/60 hover:border-ink hover:bg-cream"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="w-8 h-8 shrink-0 rounded-lg border-2 border-ink text-white flex items-center justify-center"
                            style={{ backgroundColor: pack.accentColor }}
                          >
                            {renderPackIcon(pack.icon, "w-4 h-4")}
                          </span>
                          <div className="min-w-0">
                            <div className="font-display font-bold text-sm leading-tight text-ink truncate">
                              {pack.title}
                            </div>
                            <div className="text-[11px] font-bold text-ink/55">
                              {pack.questionCount} Questions
                            </div>
                          </div>
                        </div>
                        {isSelected && (
                          <span className="w-5 h-5 shrink-0 rounded-full bg-coral text-white border border-ink flex items-center justify-center">
                            <Check className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-ink/75 leading-snug line-clamp-2">
                        {pack.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="riso-card px-4 py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className="w-8 h-8 shrink-0 rounded-lg border-2 border-ink text-white flex items-center justify-center"
                  style={{ backgroundColor: roomState.selectedPack.accentColor }}
                >
                  {renderPackIcon(roomState.selectedPack.icon, "w-4 h-4")}
                </span>
                <div className="min-w-0">
                  <div className="text-[10px] font-display font-bold uppercase tracking-wider text-ink/55">
                    Active Question Deck
                  </div>
                  <div className="font-display font-bold text-sm text-ink truncate">
                    {roomState.selectedPack.title} •{" "}
                    {roomState.selectedPack.questionCount} Questions
                  </div>
                </div>
              </div>
              <span className="text-[11px] font-display font-bold px-2 py-0.5 rounded bg-cream border border-ink/25 text-ink/60 shrink-0">
                Locked
              </span>
            </div>
          )}

          {/* Live Player Roster */}
          <div className="riso-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-indigoParty" />
              <h2 className="text-lg font-display font-bold">
                Party Roster ({roomState.players.length})
              </h2>
            </div>
            <span className="text-xs font-display font-bold text-ink/60">
              {roomState.participatingCount} matching
            </span>
          </div>

          <div className="divide-y-2 divide-dashed divide-ink/15 max-h-[520px] overflow-y-auto pr-1">
            {roomState.players.map((p) => {
              const isParticipating = !p.isHost || roomState.hostParticipates;
              return (
                <div
                  key={p.id}
                  className="py-3 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative w-11 h-11 shrink-0 rounded-xl bg-cream border-2 border-ink flex items-center justify-center text-2xl">
                      {p.avatar}
                      <span
                        title={p.connected ? "Connected" : "Reconnecting"}
                        className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-ink ${
                          p.connected ? "bg-mint" : "bg-coral"
                        }`}
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-display font-bold text-sm sm:text-base truncate">
                          {p.name}
                        </span>
                        {p.isHost && (
                          <span className="px-1.5 py-0.5 rounded bg-indigoParty text-white text-[10px] font-display font-bold uppercase">
                            Host
                          </span>
                        )}
                        {p.isBot && (
                          <span className="px-1.5 py-0.5 rounded bg-marigold text-ink text-[10px] font-display font-bold uppercase">
                            Bot
                          </span>
                        )}
                        {!isParticipating && (
                          <span className="px-1.5 py-0.5 rounded bg-cream border border-ink/30 text-ink/60 text-[10px] font-display font-bold uppercase">
                            MC Only
                          </span>
                        )}
                      </div>
                      {p.spottingClue && (
                        <div className="text-xs text-ink/60 truncate">
                          Clue: “{p.spottingClue}”
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isParticipating && roomState.phase !== "LOBBY" && (
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-xs font-display font-bold ${
                          p.quizCompleted
                            ? "bg-mint/15 border-mint text-ink"
                            : "bg-cream border-ink/25 text-ink/55"
                        }`}
                      >
                        {p.quizCompleted ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-mint" />
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
                        className="w-9 h-9 rounded-lg border-2 border-ink/25 hover:border-coral hover:bg-coral/10 text-ink/60 hover:text-coral flex items-center justify-center transition-colors"
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
    </div>
  );
};
