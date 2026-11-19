import React, { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
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
  error: string | null;
}

export const JoinForm: React.FC<JoinFormProps> = ({
  initialRoomCode = "",
  onJoinRoom,
  onBack,
  error,
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
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigoParty text-white border-2 border-ink shadow-riso-sm text-xs font-display font-bold uppercase tracking-wider mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          Join Party
        </div>
        <h1 className="text-4xl font-display font-bold text-ink leading-tight">
          Spark<span className="text-coral">Match</span>
        </h1>
      </div>

      {error && (
        <div className="mb-4 p-3.5 rounded-xl bg-coral/15 border-2 border-coral text-ink text-sm font-semibold">
          {error}
        </div>
      )}

      <motion.form
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="riso-card p-6 space-y-5"
      >
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-sm font-display font-bold text-ink/70 hover:text-ink min-h-[40px]"
          >
            <ArrowLeft className="w-4 h-4" />
            Home
          </button>
          {initialRoomCode && (
            <span className="px-2.5 py-1 rounded-lg bg-marigold/40 border border-ink text-xs font-display font-bold">
              Invited to {initialRoomCode.toUpperCase()}
            </span>
          )}
        </div>

        <div>
          <label
            htmlFor="join-code"
            className="block text-sm font-display font-bold mb-1.5"
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
            className="riso-input font-display font-bold text-2xl tracking-[0.25em] text-center uppercase"
          />
        </div>

        <div>
          <label
            htmlFor="guest-name"
            className="block text-sm font-display font-bold mb-1.5"
          >
            Your First Name (or Nickname)
          </label>
          <input
            id="guest-name"
            type="text"
            required
            maxLength={24}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Jordan"
            className="riso-input"
            autoFocus={Boolean(initialRoomCode)}
          />
        </div>

        <div>
          <span className="block text-sm font-display font-bold mb-2">
            Choose Your Avatar
          </span>
          <div className="grid grid-cols-8 gap-1.5">
            {AVATAR_OPTIONS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => setAvatar(emoji)}
                aria-label={`Select avatar ${emoji}`}
                className={`h-11 rounded-xl border-2 text-xl flex items-center justify-center transition-all ${
                  avatar === emoji
                    ? "bg-marigold border-ink shadow-riso-sm scale-105"
                    : "bg-cream border-ink/25 hover:border-ink"
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
            className="block text-sm font-display font-bold mb-1.5"
          >
            Spotting Clue{" "}
            <span className="font-normal text-ink/55">(helps your match find you!)</span>
          </label>
          <input
            id="spotting-clue"
            type="text"
            maxLength={80}
            value={spottingClue}
            onChange={(e) => setSpottingClue(e.target.value)}
            placeholder="e.g., wearing red sneakers"
            className="riso-input"
          />
        </div>

        <button
          type="submit"
          disabled={submitting || roomCode.trim().length < 4 || !name.trim()}
          className="riso-btn-indigo w-full text-base"
        >
          {submitting ? "Joining Room..." : "Join the Party"}
          <ArrowRight className="w-5 h-5" />
        </button>
      </motion.form>
    </div>
  );
};
