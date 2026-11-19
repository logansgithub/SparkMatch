import React from "react";
import { motion } from "framer-motion";
import { Eye, Search, Sparkles } from "lucide-react";

interface ClueTeaserProps {
  roomCode: string;
  partnerClues: string[];
}

export const ClueTeaser: React.FC<ClueTeaserProps> = ({
  roomCode,
  partnerClues,
}) => {
  const isTrio = partnerClues.length > 1;

  return (
    <div className="w-full max-w-md mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, rotate: -1 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="riso-card p-6 space-y-5 relative overflow-hidden"
      >
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-marigold border-2 border-ink shadow-riso-sm text-xs font-display font-bold uppercase tracking-wider">
            <Search className="w-3.5 h-3.5" />
            Secret Clue Teaser
          </span>
          <span className="text-xs font-display font-bold text-ink/55">
            ROOM {roomCode}
          </span>
        </div>

        <div className="text-center space-y-2 py-2">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-indigoParty text-white border-2 border-ink shadow-riso flex items-center justify-center">
            <Eye className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-display font-bold leading-tight">
            {isTrio
              ? "You're in a Power Trio! Look around for..."
              : "Scan the room! Your match is..."}
          </h2>
          <p className="text-sm text-ink/70">
            Names are still top secret until the host starts the countdown.
          </p>
        </div>

        <div className="space-y-3">
          {partnerClues.map((clue, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 * (idx + 1) }}
              className="p-4 rounded-xl bg-cream border-2 border-ink shadow-riso-sm"
            >
              <div className="text-[11px] font-display font-bold uppercase tracking-wider text-coral mb-1">
                {isTrio ? `Match Clue #${idx + 1}` : "Spotting Clue"}
              </div>
              <p className="text-lg font-display font-bold text-ink leading-snug">
                “{clue}”
              </p>
            </motion.div>
          ))}
        </div>

        <div className="flex items-center justify-center gap-2 pt-2 text-xs font-display font-bold text-indigoParty">
          <Sparkles className="w-4 h-4 animate-pulse" />
          <span>Hold tight — the synchronized countdown is next!</span>
        </div>
      </motion.div>
    </div>
  );
};
