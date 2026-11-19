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
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 24 }}
        className="editorial-card p-6 sm:p-7 space-y-6 relative overflow-hidden"
      >
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30 text-[11px] font-bold uppercase tracking-[0.14em]">
            <Search className="w-3.5 h-3.5" />
            Clue Dossier
          </span>
          <span className="font-display font-bold text-xs tracking-widest text-zinc-400">
            {roomCode}
          </span>
        </div>

        <div className="text-center space-y-2.5 py-1">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-[#FF5C38]/15 text-[#FF5C38] border border-[#FF5C38]/30 flex items-center justify-center">
            <Eye className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-display font-extrabold leading-tight text-[#F5F4F0]">
            {isTrio
              ? "You're in a Power Trio. Look around for..."
              : "Scan the room. Your match is..."}
          </h2>
          <p className="text-sm text-zinc-400">
            Names remain sealed until the host triggers the synchronized
            countdown.
          </p>
        </div>

        <div className="space-y-3">
          {partnerClues.map((clue, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 * (idx + 1) }}
              className="p-4 rounded-xl bg-[#121214] border border-white/[0.1] space-y-1.5"
            >
              <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#FF5C38]">
                {isTrio ? `Match Clue 0${idx + 1}` : "Spotting Clue"}
              </div>
              <p className="text-lg font-display font-bold text-[#F5F4F0] leading-snug">
                “{clue}”
              </p>
            </motion.div>
          ))}
        </div>

        <div className="flex items-center justify-center gap-2 pt-1 text-xs font-semibold text-zinc-400">
          <Sparkles className="w-4 h-4 text-[#F59E0B] animate-pulse" />
          <span>Hold tight — the 10-second reveal is up next.</span>
        </div>
      </motion.div>
    </div>
  );
};
