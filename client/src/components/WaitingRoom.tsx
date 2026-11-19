import React from "react";
import { motion } from "framer-motion";
import {
  Briefcase,
  CheckCircle2,
  Clock,
  Compass,
  Flame,
  Moon,
  Sparkles,
  Users,
} from "lucide-react";
import { PublicPlayer, PublicRoomState } from "../types";

function renderPackIcon(iconName: string, className = "w-3.5 h-3.5") {
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

interface WaitingRoomProps {
  roomState: PublicRoomState;
  me: PublicPlayer | undefined;
  onLeaveRoom: () => void;
}

export const WaitingRoom: React.FC<WaitingRoomProps> = ({
  roomState,
  me,
  onLeaveRoom,
}) => {
  const isLobby = roomState.phase === "LOBBY";
  const isQuizDone = roomState.phase === "QUIZ" && me?.quizCompleted;
  const isMatched = roomState.phase === "MATCHED";

  const progressPct =
    roomState.participatingCount > 0
      ? Math.round(
          (roomState.completedCount / roomState.participatingCount) * 100
        )
      : 0;

  return (
    <div className="w-full max-w-md mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="riso-card p-6 text-center space-y-5"
      >
        <div className="flex items-center justify-between text-xs font-display font-bold">
          <span className="px-2.5 py-1 rounded-lg bg-cream border-2 border-ink uppercase tracking-wider">
            Room {roomState.code}
          </span>
          <span className="inline-flex items-center gap-1 text-ink/70">
            <Users className="w-3.5 h-3.5" />
            {roomState.participatingCount} playing
          </span>
        </div>

        {/* Live-synced Event Pack Theme Chip */}
        {roomState.selectedPack && (
          <motion.div
            key={roomState.selectedPack.id}
            initial={{ scale: 0.96, opacity: 0.7 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-2xl bg-cream border-2 border-ink shadow-riso-sm text-[11px] sm:text-xs font-display font-bold text-ink max-w-full leading-snug"
          >
            <span
              className="w-5 h-5 shrink-0 rounded-full text-white flex items-center justify-center border border-ink"
              style={{ backgroundColor: roomState.selectedPack.accentColor }}
            >
              {renderPackIcon(roomState.selectedPack.icon, "w-3 h-3")}
            </span>
            <span>
              Theme: {roomState.selectedPack.title} •{" "}
              {roomState.selectedPack.questionCount} Questions
            </span>
          </motion.div>
        )}

        <motion.div
          animate={{ rotate: [0, -6, 6, 0], scale: [1, 1.06, 1] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
          className="w-20 h-20 mx-auto rounded-2xl bg-marigold border-2 border-ink shadow-riso flex items-center justify-center text-4xl"
        >
          {me?.avatar ?? "✨"}
        </motion.div>

        {isLobby && (
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigoParty/10 text-indigoParty border border-indigoParty/30 text-xs font-display font-bold uppercase">
              <Clock className="w-3.5 h-3.5" />
              In the Lobby
            </div>
            <h2 className="text-2xl font-display font-bold">
              You're in, {me?.name ?? "friend"}!
            </h2>
            <p className="text-sm text-ink/70">
              Sit tight while everyone scans the QR code. The quiz will pop up
              here the moment the host hits Start.
            </p>
          </div>
        )}

        {isQuizDone && (
          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-mint/15 text-ink border-2 border-mint text-xs font-display font-bold uppercase">
              <CheckCircle2 className="w-3.5 h-3.5 text-mint" />
              Answers Locked In
            </div>
            <h2 className="text-2xl font-display font-bold">
              Nice picks, {me?.name}!
            </h2>
            <p className="text-sm text-ink/70">
              Waiting for the rest of the room to wrap up their quiz.
            </p>
            <div className="pt-1">
              <div className="flex justify-between text-xs font-display font-bold mb-1.5">
                <span>Room Progress</span>
                <span>
                  {roomState.completedCount} / {roomState.participatingCount}{" "}
                  done
                </span>
              </div>
              <div className="w-full h-4 rounded-full bg-cream border-2 border-ink overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPct}%` }}
                  className="h-full bg-mint"
                />
              </div>
            </div>
          </div>
        )}

        {isMatched && (
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-coral text-white border-2 border-ink shadow-riso-sm text-xs font-display font-bold uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              Matches Computed!
            </div>
            <h2 className="text-2xl font-display font-bold">
              Your match is locked in!
            </h2>
            <p className="text-sm text-ink/75">
              Keep your eyes on your phone and the host's screen — clues or the
              synchronized countdown could drop any second!
            </p>
            {roomState.hasTrio && (
              <p className="text-xs font-display font-bold text-indigoParty bg-indigoParty/10 rounded-lg py-1.5 px-3 border border-indigoParty/25">
                Odd crowd tonight — one lucky group is a Power Trio!
              </p>
            )}
          </div>
        )}

        {/* Mini avatar parade */}
        <div className="pt-2 border-t-2 border-dashed border-ink/15">
          <div className="text-xs font-display font-bold uppercase tracking-wider text-ink/50 mb-2.5">
            In the Room
          </div>
          <div className="flex flex-wrap justify-center gap-1.5">
            {roomState.players.map((p) => (
              <span
                key={p.id}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border-2 ${
                  p.id === me?.id
                    ? "bg-marigold border-ink"
                    : "bg-cream border-ink/25"
                }`}
              >
                <span>{p.avatar}</span>
                <span className="max-w-[90px] truncate">{p.name}</span>
                {p.quizCompleted && roomState.phase === "QUIZ" && (
                  <span title="Finished quiz">✅</span>
                )}
              </span>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={onLeaveRoom}
          className="text-xs font-display font-bold text-ink/50 hover:text-coral underline pt-1"
        >
          Leave room
        </button>
      </motion.div>
    </div>
  );
};
