import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  QrCode,
  Shuffle,
  Skull,
  Sparkles,
  Users,
} from "lucide-react";
import { AVATAR_OPTIONS } from "../types";

interface LandingScreenProps {
  onCreateRoom: (params: {
    hostName: string;
    avatar: string;
    spottingClue: string;
    hostParticipates: boolean;
    revealWorstEnemy: boolean;
  }) => Promise<void>;
  onGoToJoin: () => void;
}

export const LandingScreen: React.FC<LandingScreenProps> = ({
  onCreateRoom,
  onGoToJoin,
}) => {
  const [mode, setMode] = useState<"home" | "create">("home");
  const [hostName, setHostName] = useState("");
  const [avatar, setAvatar] = useState("🪩");
  const [spottingClue, setSpottingClue] = useState("");
  const [hostParticipates, setHostParticipates] = useState(false);
  const [revealWorstEnemy, setRevealWorstEnemy] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hostName.trim()) return;
    setSubmitting(true);
    try {
      await onCreateRoom({
        hostName: hostName.trim(),
        avatar,
        spottingClue: spottingClue.trim(),
        hostParticipates,
        revealWorstEnemy,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto px-4 py-8">
      {/* Editorial Brand Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1A1A1E] border border-white/[0.1] text-[#F59E0B] text-[11px] font-sans font-bold uppercase tracking-[0.16em] mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          Live Party Matcher
        </div>
        <h1 className="text-5xl font-display font-extrabold tracking-tight text-[#F5F4F0] leading-none">
          Spark<span className="text-[#FF5C38]">Match</span>
        </h1>
        <p className="mt-3.5 text-sm sm:text-base text-zinc-400 font-medium max-w-xs mx-auto leading-relaxed">
          Twelve sharp prompts. One global optimal pairing. A synchronized
          10-second reveal across the room.
        </p>
      </motion.div>

      {mode === "home" ? (
        <motion.div
          key="home"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="editorial-card p-6 sm:p-7 space-y-5"
        >
          {/* Three-step editorial strip */}
          <div className="grid grid-cols-3 gap-2.5 text-center">
            <div className="editorial-subcard p-3 flex flex-col items-center gap-1.5">
              <QrCode className="w-4 h-4 text-[#FF5C38]" />
              <div className="text-[11px] font-semibold text-zinc-300 tracking-wide">
                Scan QR
              </div>
            </div>
            <div className="editorial-subcard p-3 flex flex-col items-center gap-1.5">
              <Shuffle className="w-4 h-4 text-[#F59E0B]" />
              <div className="text-[11px] font-semibold text-zinc-300 tracking-wide">
                12 Prompts
              </div>
            </div>
            <div className="editorial-subcard p-3 flex flex-col items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#FF5C38]" />
              <div className="text-[11px] font-semibold text-zinc-300 tracking-wide">
                Sync Reveal
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-1">
            <button
              type="button"
              onClick={() => setMode("create")}
              className="editorial-btn-primary w-full"
            >
              <Sparkles className="w-4 h-4" />
              Host a Room
              <ArrowRight className="w-4 h-4 ml-auto" />
            </button>

            <button
              type="button"
              onClick={onGoToJoin}
              className="editorial-btn-secondary w-full"
            >
              <Users className="w-4 h-4 text-[#F59E0B]" />
              Join with Code
              <ArrowRight className="w-4 h-4 ml-auto text-zinc-400" />
            </button>
          </div>

          <p className="text-center text-xs text-zinc-500 pt-1">
            No accounts, no installs — share the QR code and play instantly.
          </p>
        </motion.div>
      ) : (
        <motion.form
          key="create"
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          onSubmit={handleSubmit}
          className="editorial-card p-6 sm:p-7 space-y-5"
        >
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setMode("home")}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-400 hover:text-[#F5F4F0] min-h-[48px] -ml-1 px-1 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] px-2.5 py-1 rounded-md bg-[#FF5C38]/15 text-[#FF5C38] border border-[#FF5C38]/25">
              Host Setup
            </span>
          </div>

          <div>
            <label
              htmlFor="host-name"
              className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2"
            >
              Your Host Name
            </label>
            <input
              id="host-name"
              type="text"
              required
              maxLength={24}
              value={hostName}
              onChange={(e) => setHostName(e.target.value)}
              placeholder="e.g., Alex"
              className="editorial-input"
              autoFocus
            />
          </div>

          <div>
            <span className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
              Choose Avatar
            </span>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {AVATAR_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setAvatar(emoji)}
                  aria-label={`Select avatar ${emoji}`}
                  className={`h-12 rounded-xl border text-xl flex items-center justify-center transition-all active:scale-95 ${
                    avatar === emoji
                      ? "bg-[#FF5C38]/20 border-[#FF5C38] scale-105"
                      : "bg-[#121214] border-white/[0.08] hover:border-white/25"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2.5">
            <label className="flex items-start gap-3 p-3.5 rounded-xl bg-[#121214] border border-white/[0.08] hover:border-white/20 transition-colors cursor-pointer min-h-[56px]">
              <input
                type="checkbox"
                checked={hostParticipates}
                onChange={(e) => setHostParticipates(e.target.checked)}
                className="mt-1 w-4 h-4 accent-[#FF5C38] rounded cursor-pointer shrink-0"
              />
              <div>
                <div className="text-sm font-semibold text-[#F5F4F0]">
                  Include me in the matching
                </div>
                <div className="text-xs text-zinc-400 mt-0.5 leading-snug">
                  Leave unchecked to MC from a laptop or TV; enable to take the
                  quiz too.
                </div>
              </div>
            </label>

            {hostParticipates && (
              <div>
                <label
                  htmlFor="host-clue"
                  className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2"
                >
                  Your Spotting Clue{" "}
                  <span className="font-normal normal-case text-zinc-500">
                    (optional)
                  </span>
                </label>
                <input
                  id="host-clue"
                  type="text"
                  maxLength={80}
                  value={spottingClue}
                  onChange={(e) => setSpottingClue(e.target.value)}
                  placeholder="e.g., wearing red sneakers"
                  className="editorial-input"
                />
              </div>
            )}

            <label className="flex items-start gap-3 p-3.5 rounded-xl bg-[#121214] border border-white/[0.08] hover:border-white/20 transition-colors cursor-pointer min-h-[56px]">
              <input
                type="checkbox"
                checked={revealWorstEnemy}
                onChange={(e) => setRevealWorstEnemy(e.target.checked)}
                className="mt-1 w-4 h-4 accent-[#F59E0B] rounded cursor-pointer shrink-0"
              />
              <div>
                <div className="text-sm font-semibold text-[#F5F4F0] flex items-center gap-1.5">
                  <Skull className="w-3.5 h-3.5 text-[#F59E0B]" />
                  Also reveal each player's “Worst Enemy”
                </div>
                <div className="text-xs text-zinc-400 mt-0.5 leading-snug">
                  Adds a bonus nemesis reveal showing the least similar person
                  in the room.
                </div>
              </div>
            </label>
          </div>

          <button
            type="submit"
            disabled={submitting || !hostName.trim()}
            className="editorial-btn-primary w-full"
          >
            {submitting ? "Creating Room..." : "Create Party Room"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </motion.form>
      )}
    </div>
  );
};
