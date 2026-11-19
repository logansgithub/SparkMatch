import React from "react";
import { motion } from "framer-motion";
import {
  Check,
  CheckCircle2,
  Clock,
  LogOut,
  Sparkles,
  Users,
} from "lucide-react";
import { PublicPlayer, PublicRoomState } from "../types";

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
        className="editorial-card p-6 sm:p-7 text-center space-y-6"
      >
        <div className="flex items-center justify-between text-xs font-bold">
          <span className="px-2.5 py-1 rounded-lg bg-[#121214] border border-white/[0.1] font-display tracking-widest text-[#F5F4F0]">
            {roomState.code}
          </span>
          <span className="inline-flex items-center gap-1.5 text-zinc-400 tabular-nums">
            <Users className="w-3.5 h-3.5 text-[#F59E0B]" />
            {roomState.participatingCount} playing
          </span>
        </div>

        {/* Avatar centerpiece */}
        <motion.div
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="w-20 h-20 mx-auto rounded-2xl bg-[#121214] border border-white/[0.14] shadow-editorial-sm flex items-center justify-center text-4xl"
        >
          {me?.avatar ?? "✨"}
        </motion.div>

        {isLobby && (
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30 text-[11px] font-bold uppercase tracking-[0.14em]">
              <Clock className="w-3.5 h-3.5" />
              In the Lobby
            </div>
            <h2 className="text-2xl font-display font-extrabold text-[#F5F4F0]">
              You're in, {me?.name ?? "friend"}
            </h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Sit tight while everyone scans the QR code. The deck will deal
              automatically when the host starts the quiz.
            </p>
          </div>
        )}

        {isQuizDone && (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold uppercase tracking-[0.14em]">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Answers Locked In
              </div>
              <h2 className="text-2xl font-display font-extrabold text-[#F5F4F0]">
                Deck complete, {me?.name}
              </h2>
              <p className="text-sm text-zinc-400">
                Waiting for the rest of the room to finish their prompts.
              </p>
            </div>

            <div className="editorial-subcard p-4 space-y-2.5">
              <div className="flex justify-between text-xs font-bold tabular-nums">
                <span className="text-zinc-400 uppercase tracking-wider">
                  Room Progress
                </span>
                <span className="text-[#F5F4F0]">
                  {roomState.completedCount} / {roomState.participatingCount}{" "}
                  done
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-[#1A1A1E] border border-white/[0.08] overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPct}%` }}
                  transition={{ type: "spring", stiffness: 220, damping: 24 }}
                  className="h-full bg-[#FF5C38] rounded-full"
                />
              </div>
            </div>
          </div>
        )}

        {isMatched && (
          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FF5C38]/15 text-[#FF5C38] border border-[#FF5C38]/30 text-[11px] font-bold uppercase tracking-[0.14em]">
              <Sparkles className="w-3.5 h-3.5" />
              Matches Computed
            </div>
            <h2 className="text-2xl font-display font-extrabold text-[#F5F4F0]">
              Your match is locked in
            </h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Keep your phone ready — spotting clues or the synchronized
              10-second countdown could start any moment.
            </p>
            {roomState.hasTrio && (
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#F59E0B] bg-[#F59E0B]/10 rounded-xl py-2 px-3 border border-[#F59E0B]/25">
                <Users className="w-3.5 h-3.5 shrink-0" />
                Odd crowd tonight — one lucky group is a Power Trio.
              </div>
            )}
          </div>
        )}

        {/* Guest roster pills */}
        <div className="pt-4 border-t border-white/[0.08]">
          <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-500 mb-3">
            In the Room
          </div>
          <div className="flex flex-wrap justify-center gap-1.5">
            {roomState.players.map((p) => (
              <span
                key={p.id}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border ${
                  p.id === me?.id
                    ? "bg-[#FF5C38]/15 border-[#FF5C38]/40 text-[#F5F4F0]"
                    : "bg-[#121214] border-white/[0.08] text-zinc-300"
                }`}
              >
                <span className="text-sm leading-none">{p.avatar}</span>
                <span className="max-w-[92px] truncate">{p.name}</span>
                {p.quizCompleted && roomState.phase === "QUIZ" && (
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                )}
              </span>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={onLeaveRoom}
          className="inline-flex items-center justify-center gap-1.5 min-h-[48px] px-4 text-xs font-semibold text-zinc-500 hover:text-[#FF5C38] transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          Leave room
        </button>
      </motion.div>
    </div>
  );
};
