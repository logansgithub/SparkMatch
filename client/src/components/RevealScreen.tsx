import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Flame, MapPin, Sparkles, Star, Users } from "lucide-react";
import { RevealPayload } from "../types";

interface RevealScreenProps {
  roomCode: string;
  revealPayload: RevealPayload;
}

export const RevealScreen: React.FC<RevealScreenProps> = ({
  roomCode,
  revealPayload,
}) => {
  // Align countdown to server clock so every phone flips in exact sync
  const clockOffset = useMemo(
    () => revealPayload.serverNow - Date.now(),
    [revealPayload.serverNow]
  );

  const computeRemainingMs = () =>
    Math.max(0, revealPayload.revealAt - (Date.now() + clockOffset));

  const [remainingMs, setRemainingMs] = useState<number>(computeRemainingMs);

  useEffect(() => {
    setRemainingMs(computeRemainingMs());
    const timer = window.setInterval(() => {
      const next = computeRemainingMs();
      setRemainingMs(next);
      if (next <= 0) {
        window.clearInterval(timer);
      }
    }, 100);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealPayload.revealAt, clockOffset]);

  const secondsLeft = Math.ceil(remainingMs / 1000);
  const isRevealed = remainingMs <= 0;
  const isTrio = revealPayload.partners.length > 1;
  const { match, partners } = revealPayload;

  return (
    <div className="w-full max-w-md mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4 text-xs font-display font-bold">
        <span className="px-2.5 py-1 rounded-lg bg-white border-2 border-ink shadow-riso-sm">
          ROOM {roomCode}
        </span>
        <span
          className={`px-2.5 py-1 rounded-full border-2 border-ink uppercase tracking-wider ${
            isRevealed ? "bg-marigold text-ink" : "bg-coral text-white"
          }`}
        >
          {isRevealed ? "Match Revealed!" : "Synced Countdown"}
        </span>
      </div>

      {/* 3D Flip Card Stage */}
      <div className="flip-perspective w-full">
        <motion.div
          className="flip-preserve-3d grid grid-cols-1 grid-rows-1 w-full"
          initial={{ rotateY: 0 }}
          animate={{ rotateY: isRevealed ? 180 : 0 }}
          transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* FRONT FACE: Synchronized 10-second countdown */}
          <div
            aria-hidden={isRevealed}
            className="col-start-1 row-start-1 flip-backface-hidden riso-card bg-ink text-cream p-6 flex flex-col items-center justify-center text-center min-h-[460px] space-y-6"
          >
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-marigold text-ink border-2 border-cream text-xs font-display font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              Hold Up Your Phone!
            </div>

            <motion.div
              key={secondsLeft}
              initial={{ scale: 1.35, opacity: 0.4 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.25 }}
              className="w-36 h-36 rounded-3xl bg-coral text-white border-4 border-cream shadow-riso-lg flex items-center justify-center font-display font-bold text-7xl"
            >
              {Math.max(0, secondsLeft)}
            </motion.div>

            <div className="space-y-1.5 max-w-xs">
              <h2 className="text-2xl font-display font-bold text-cream">
                {secondsLeft > 3
                  ? "Matching wavelengths across the room..."
                  : "Get ready to flip!"}
              </h2>
              <p className="text-sm text-cream/75">
                Everyone's card flips together when the timer hits zero.
              </p>
            </div>
          </div>

          {/* BACK FACE: Revealed Match Card */}
          <div
            aria-hidden={!isRevealed}
            className={`col-start-1 row-start-1 flip-backface-hidden flip-rotate-y-180 riso-card bg-white p-5 sm:p-6 space-y-5 ${
              isRevealed ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          >
            {/* Header Banner + Compatibility Badge */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigoParty text-white border-2 border-ink text-[11px] font-display font-bold uppercase tracking-wider mb-1.5">
                  {isTrio ? (
                    <>
                      <Users className="w-3 h-3" /> Power Trio Match
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3 h-3" /> Your SparkMatch
                    </>
                  )}
                </div>
                <h2 className="text-2xl sm:text-3xl font-display font-bold leading-tight text-ink break-words">
                  {partners.map((p) => p.name).join(" & ")}
                </h2>
              </div>

              <div className="shrink-0 px-3 py-2 rounded-2xl bg-marigold border-2 border-ink shadow-riso-sm text-center">
                <div className="text-2xl sm:text-3xl font-display font-bold leading-none text-ink">
                  {match.compatibility}%
                </div>
                <div className="text-[10px] font-display font-bold uppercase tracking-wider text-ink/80 mt-0.5">
                  Match
                </div>
              </div>
            </div>

            {/* Partner Profile Pill(s) */}
            <div className="space-y-2.5">
              {partners.map((partner) => (
                <div
                  key={partner.id}
                  className="flex items-center gap-3.5 p-3.5 rounded-xl bg-cream border-2 border-ink shadow-riso-sm"
                >
                  <div className="w-14 h-14 shrink-0 rounded-xl bg-white border-2 border-ink flex items-center justify-center text-3xl">
                    {partner.avatar}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-display font-bold text-lg text-ink truncate">
                      {partner.name}
                    </div>
                    <div className="flex items-start gap-1.5 text-xs sm:text-sm text-ink/75 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-coral" />
                      <span className="break-words">
                        {partner.spottingClue?.trim()
                          ? partner.spottingClue
                          : "No spotting clue listed — shout their name!"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Top 2 Rarity Highlights */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-display font-bold uppercase tracking-wider text-indigoParty">
                <Star className="w-4 h-4 fill-marigold text-ink" />
                Why You Matched
              </div>
              {match.sharedHighlights.map((highlight, idx) => (
                <div
                  key={`${highlight.questionId}-${idx}`}
                  className="p-3.5 rounded-xl bg-indigoParty/5 border-2 border-ink space-y-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-white border border-ink text-[11px] font-display font-bold uppercase">
                      {highlight.topicTag}
                    </span>
                    <span className="text-[11px] font-display font-bold text-indigoParty">
                      Rare Match
                    </span>
                  </div>
                  <p className="text-sm font-medium text-ink leading-snug">
                    {highlight.description}
                  </p>
                </div>
              ))}
            </div>

            {/* 1 Spicy Difference */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-display font-bold uppercase tracking-wider text-coral">
                <Flame className="w-4 h-4 fill-coral text-ink" />
                Your Spicy Difference
              </div>
              <div className="p-3.5 rounded-xl bg-coral/10 border-2 border-ink space-y-1">
                <span className="inline-block px-2 py-0.5 rounded-md bg-coral text-white border border-ink text-[11px] font-display font-bold uppercase">
                  {match.spicyDifference.topicTag}
                </span>
                <p className="text-sm font-medium text-ink leading-snug">
                  {match.spicyDifference.description}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
