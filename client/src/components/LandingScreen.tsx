import React, { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Users, ArrowRight, ArrowLeft } from "lucide-react";
import { AVATAR_OPTIONS } from "../types";

interface LandingScreenProps {
  onCreateRoom: (params: {
    hostName: string;
    avatar: string;
    spottingClue: string;
    hostParticipates: boolean;
  }) => Promise<void>;
  onGoToJoin: () => void;
  error: string | null;
}

export const LandingScreen: React.FC<LandingScreenProps> = ({
  onCreateRoom,
  onGoToJoin,
  error,
}) => {
  const [mode, setMode] = useState<"home" | "create">("home");
  const [hostName, setHostName] = useState("");
  const [avatar, setAvatar] = useState("🪩");
  const [spottingClue, setSpottingClue] = useState("");
  const [hostParticipates, setHostParticipates] = useState(false);
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
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto px-4 py-8">
      {/* Brand Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-marigold border-2 border-ink shadow-riso-sm text-xs font-display font-bold uppercase tracking-wider mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          Live Party Matcher
        </div>
        <h1 className="text-5xl font-display font-bold tracking-tight text-ink leading-none">
          Spark<span className="text-coral">Match</span>
        </h1>
        <p className="mt-3 text-base text-ink/75 font-medium max-w-xs mx-auto">
          Answer 12 unhinged personality questions. Watch the room count down.
          Find your closest wavelength.
        </p>
      </motion.div>

      {error && (
        <div className="mb-4 p-3.5 rounded-xl bg-coral/15 border-2 border-coral text-ink text-sm font-semibold">
          {error}
        </div>
      )}

      {mode === "home" ? (
        <motion.div
          key="home"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="riso-card p-6 space-y-4"
        >
          <div className="grid grid-cols-3 gap-2 pb-2 text-center">
            <div className="p-2.5 rounded-xl bg-cream border-2 border-ink">
              <div className="text-xl mb-0.5">📱</div>
              <div className="text-xs font-display font-bold">Scan QR</div>
            </div>
            <div className="p-2.5 rounded-xl bg-cream border-2 border-ink">
              <div className="text-xl mb-0.5">🧠</div>
              <div className="text-xs font-display font-bold">12 Prompts</div>
            </div>
            <div className="p-2.5 rounded-xl bg-cream border-2 border-ink">
              <div className="text-xl mb-0.5">⚡</div>
              <div className="text-xs font-display font-bold">Sync Reveal</div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setMode("create")}
            className="riso-btn-coral w-full text-lg"
          >
            <Sparkles className="w-5 h-5" />
            Host a Room
          </button>

          <button
            type="button"
            onClick={onGoToJoin}
            className="riso-btn-marigold w-full text-lg"
          >
            <Users className="w-5 h-5" />
            Join with Code
          </button>

          <p className="text-center text-xs text-ink/60 pt-1">
            No accounts, no downloads — just pass around the QR code.
          </p>
        </motion.div>
      ) : (
        <motion.form
          key="create"
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          onSubmit={handleSubmit}
          className="riso-card p-6 space-y-5"
        >
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setMode("home")}
              className="inline-flex items-center gap-1.5 text-sm font-display font-bold text-ink/70 hover:text-ink min-h-[40px]"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <span className="text-xs font-display font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-indigoParty/10 text-indigoParty border border-indigoParty/30">
              Host Setup
            </span>
          </div>

          <div>
            <label
              htmlFor="host-name"
              className="block text-sm font-display font-bold mb-1.5"
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
              className="riso-input"
              autoFocus
            />
          </div>

          <div>
            <span className="block text-sm font-display font-bold mb-2">
              Pick Your Avatar
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

          <label className="flex items-start gap-3 p-3.5 rounded-xl bg-cream border-2 border-ink cursor-pointer">
            <input
              type="checkbox"
              checked={hostParticipates}
              onChange={(e) => setHostParticipates(e.target.checked)}
              className="mt-0.5 w-5 h-5 accent-indigoParty rounded cursor-pointer"
            />
            <div>
              <div className="text-sm font-display font-bold">
                Include me in the matching
              </div>
              <div className="text-xs text-ink/65">
                Leave unchecked to MC from a laptop or TV screen; check if you
                want to take the quiz too!
              </div>
            </div>
          </label>

          {hostParticipates && (
            <div>
              <label
                htmlFor="host-clue"
                className="block text-sm font-display font-bold mb-1.5"
              >
                Your Spotting Clue{" "}
                <span className="font-normal text-ink/55">(optional)</span>
              </label>
              <input
                id="host-clue"
                type="text"
                maxLength={80}
                value={spottingClue}
                onChange={(e) => setSpottingClue(e.target.value)}
                placeholder="e.g., wearing red sneakers"
                className="riso-input"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !hostName.trim()}
            className="riso-btn-coral w-full text-base"
          >
            {submitting ? "Creating Room..." : "Create Party Room"}
            <ArrowRight className="w-5 h-5" />
          </button>
        </motion.form>
      )}
    </div>
  );
};
