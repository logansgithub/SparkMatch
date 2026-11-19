import React, { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Sparkles, Ticket } from "lucide-react";
import { AVATAR_OPTIONS } from "../types";

interface JoinFormProps {
  initialRoomCode?: string;
  onJoinRoom: (params: {
    roomCode: string;
    name: string;
    avatar: string;
    spottingClue: string;
  }) => Promise<void>;
  onBack: () => void;
}

export const JoinForm: React.FC<JoinFormProps> = ({
  initialRoomCode = "",
  onJoinRoom,
  onBack,
}) => {
  const [roomCode, setRoomCode] = useState(initialRoomCode.toUpperCase());
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("🦊");
  const [spottingClue, setSpottingClue] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomCode.trim() || !name.trim()) return;
    setSubmitting(true);
    try {
      await onJoinRoom({
        roomCode: roomCode.trim().toUpperCase(),
        name: name.trim(),
        avatar,
        spottingClue: spottingClue.trim(),
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto px-4 py-8">
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1A1A1E] border border-white/[0.1] text-[#F59E0B] text-[11px] font-bold uppercase tracking-[0.16em] mb-3">
          <Ticket className="w-3.5 h-3.5" />
          Guest Pass
        </div>
        <h1 className="text-4xl font-display font-extrabold text-[#F5F4F0] leading-tight">
          Spark<span className="text-[#FF5C38]">Match</span>
        </h1>
      </div>

      <motion.form
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="editorial-card p-6 sm:p-7 space-y-5"
      >
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-400 hover:text-[#F5F4F0] min-h-[48px] -ml-1 px-1 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Home
          </button>
          {initialRoomCode && (
            <span className="px-2.5 py-1 rounded-md bg-[#F59E0B]/15 border border-[#F59E0B]/30 text-[#F59E0B] text-[11px] font-bold uppercase tracking-wider">
              Room {initialRoomCode.toUpperCase()}
            </span>
          )}
        </div>

        <div>
          <label
            htmlFor="join-code"
            className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2"
          >
            4-Letter Room Code
          </label>
          <input
            id="join-code"
            type="text"
            required
            maxLength={4}
            value={roomCode}
            onChange={(e) =>
              setRoomCode(e.target.value.replace(/[^a-zA-Z]/g, "").toUpperCase())
            }
            placeholder="WXYZ"
            className="editorial-input font-display font-extrabold text-2xl tracking-[0.28em] text-center uppercase"
          />
        </div>

        <div>
          <label
            htmlFor="guest-name"
            className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2"
          >
            Your First Name
          </label>
          <input
            id="guest-name"
            type="text"
            required
            maxLength={24}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Jordan"
            className="editorial-input"
            autoFocus={Boolean(initialRoomCode)}
          />
        </div>

        <div>
          <span className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
            Pick Your Avatar
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

        <div>
          <label
            htmlFor="spotting-clue"
            className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2"
          >
            Spotting Clue{" "}
            <span className="font-normal normal-case text-zinc-500">
              (helps your match spot you)
            </span>
          </label>
          <input
            id="spotting-clue"
            type="text"
            maxLength={80}
            value={spottingClue}
            onChange={(e) => setSpottingClue(e.target.value)}
            placeholder="e.g., wearing red sneakers"
            className="editorial-input"
          />
        </div>

        <button
          type="submit"
          disabled={submitting || roomCode.trim().length < 4 || !name.trim()}
          className="editorial-btn-primary w-full"
        >
          <Sparkles className="w-4 h-4" />
          {submitting ? "Joining Room..." : "Join the Party"}
          <ArrowRight className="w-4 h-4 ml-auto" />
        </button>
      </motion.form>
    </div>
  );
};
