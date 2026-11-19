import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { Flame, MapPin, Skull, Sparkles, Timer, Users } from "lucide-react";
import { RevealPayload } from "../types";

interface RevealScreenProps {
  roomCode: string;
  revealPayload: RevealPayload;
}

export const RevealScreen: React.FC<RevealScreenProps> = ({
  roomCode,
  revealPayload,
}) => {
  const clockOffset = useMemo(
    () => revealPayload.serverNow - Date.now(),
    [revealPayload.serverNow]
  );

  const computeRemainingMs = () =>
    Math.max(0, revealPayload.revealAt - (Date.now() + clockOffset));

  const [remainingMs, setRemainingMs] = useState<number>(computeRemainingMs);
  const confettiFiredRef = useRef<number | null>(null);

  useEffect(() => {
    setRemainingMs(computeRemainingMs());
    const timer = window.setInterval(() => {
      const next = computeRemainingMs();
      setRemainingMs(next);
      if (next <= 0) {
        window.clearInterval(timer);
      }
    }, 80);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealPayload.revealAt, clockOffset]);

  const secondsLeft = Math.ceil(remainingMs / 1000);
  const isRevealed = remainingMs <= 0;
  const countdownProgress = Math.max(0, Math.min(100, (remainingMs / 10000) * 100));

  // Trigger dual bottom-corner canvas-confetti burst once when countdown hits zero
  useEffect(() => {
    if (!isRevealed) return;
    if (confettiFiredRef.current === revealPayload.revealAt) return;
    confettiFiredRef.current = revealPayload.revealAt;

    const palette = ["#FF5C38", "#F59E0B", "#F5F4F0", "#FF8A6B"];

    confetti({
      particleCount: 55,
      angle: 62,
      spread: 58,
      startVelocity: 48,
      origin: { x: 0.04, y: 0.96 },
      colors: palette,
    });

    confetti({
      particleCount: 55,
      angle: 118,
      spread: 58,
      startVelocity: 48,
      origin: { x: 0.96, y: 0.96 },
      colors: palette,
    });
  }, [isRevealed, revealPayload.revealAt]);

  const isTrio = revealPayload.partners.length > 1;
  const { match, partners, worstEnemy } = revealPayload;

  return (
    <div className="w-full max-w-md mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <span className="px-2.5 py-1 rounded-lg bg-[#1A1A1E] border border-white/[0.1] font-display font-bold text-xs tracking-widest text-[#F5F4F0]">
          {roomCode}
        </span>
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-bold uppercase tracking-[0.14em] ${
            isRevealed
              ? "bg-[#FF5C38]/15 border-[#FF5C38]/40 text-[#FF5C38]"
              : "bg-[#F59E0B]/15 border-[#F59E0B]/35 text-[#F59E0B]"
          }`}
        >
          {isRevealed ? (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              Card Revealed
            </>
          ) : (
            <>
              <Timer className="w-3.5 h-3.5" />
              Synced Countdown
            </>
          )}
        </span>
      </div>

      {/* 3D Flip Stage */}
      <div className="flip-perspective w-full">
        <motion.div
          className="flip-preserve-3d grid grid-cols-1 grid-rows-1 w-full"
          initial={{ rotateY: 0 }}
          animate={{ rotateY: isRevealed ? 180 : 0 }}
          transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* FRONT FACE: Synchronized 10-second Countdown */}
          <div
            aria-hidden={isRevealed}
            className="col-start-1 row-start-1 flip-backface-hidden editorial-card p-6 sm:p-8 flex flex-col items-center justify-center text-center min-h-[480px] space-y-7 relative overflow-hidden"
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 riso-grain opacity-40"
            />

            <div className="relative z-10 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#121214] border border-white/[0.12] text-[#F59E0B] text-[11px] font-bold uppercase tracking-[0.16em]">
              <Sparkles className="w-3.5 h-3.5" />
              Hold Up Your Phone
            </div>

            <motion.div
              key={secondsLeft}
              initial={{ scale: 1.18, opacity: 0.5 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.22 }}
              className="relative z-10 w-40 h-40 rounded-3xl bg-[#121214] border border-white/[0.12] shadow-editorial flex items-center justify-center"
            >
              <span className="font-display font-black text-7xl tracking-tighter tabular-nums text-[#FF5C38]">
                {Math.max(0, secondsLeft)}
              </span>
            </motion.div>

            <div className="relative z-10 w-full max-w-[240px] space-y-3">
              <div className="w-full h-1.5 rounded-full bg-[#121214] overflow-hidden border border-white/[0.08]">
                <div
                  className="h-full bg-[#FF5C38] transition-all duration-100"
                  style={{ width: `${countdownProgress}%` }}
                />
              </div>
              <h2 className="text-xl font-display font-bold text-[#F5F4F0]">
                {secondsLeft > 3
                  ? "Aligning room wavelengths..."
                  : "Get ready to flip"}
              </h2>
              <p className="text-xs text-zinc-400">
                Every player's card unlocks at the exact same second.
              </p>
            </div>
          </div>

          {/* BACK FACE: Collectible Risograph / Trading Card */}
          <div
            aria-hidden={!isRevealed}
            className={`col-start-1 row-start-1 flip-backface-hidden flip-rotate-y-180 editorial-card p-2 relative overflow-hidden ${
              isRevealed ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          >
            {/* Subtle textured risograph grain overlay */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 riso-grain opacity-50"
            />

            {/* Inner Trading-Card Hairline Frame */}
            <div className="relative z-10 rounded-xl border border-white/[0.1] bg-[#1A1A1E]/90 p-5 sm:p-6 space-y-5">
              {/* Collectible Edition Header */}
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500 pb-3 border-b border-white/[0.08]">
                <span>SPARKMATCH // COLLECTIBLE</span>
                <span>NO. {roomCode}</span>
              </div>

              {/* Match Name + Bold Compatibility Stamp */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FF5C38]/15 border border-[#FF5C38]/35 text-[#FF5C38] text-[10px] font-bold uppercase tracking-[0.14em] mb-2">
                    {isTrio ? (
                      <>
                        <Users className="w-3 h-3" /> Power Trio
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3" /> Your Match
                      </>
                    )}
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-display font-extrabold leading-tight text-[#F5F4F0] break-words">
                    {partners.map((p) => p.name).join(" & ")}
                  </h2>
                </div>

                {/* Bold Persimmon Coral Compatibility Badge */}
                <div className="shrink-0 px-3.5 py-2.5 rounded-2xl bg-[#FF5C38] text-[#121214] text-center shadow-[0_6px_20px_rgba(255,92,56,0.28)]">
                  <div className="text-2xl sm:text-3xl font-display font-black leading-none tabular-nums tracking-tighter">
                    {match.compatibility}%
                  </div>
                  <div className="text-[10px] font-extrabold uppercase tracking-[0.14em] mt-1 opacity-85">
                    Match
                  </div>
                </div>
              </div>

              {/* Partner Avatar & Spotting Clue Tile(s) */}
              <div className="space-y-2.5">
                {partners.map((partner) => (
                  <div
                    key={partner.id}
                    className="flex items-center gap-3.5 p-3.5 rounded-xl bg-[#121214] border border-white/[0.09]"
                  >
                    <div className="w-14 h-14 shrink-0 rounded-xl bg-[#1A1A1E] border border-white/[0.12] flex items-center justify-center text-3xl">
                      {partner.avatar}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-display font-bold text-lg text-[#F5F4F0] truncate">
                        {partner.name}
                      </div>
                      <div className="flex items-start gap-1.5 text-xs sm:text-sm text-zinc-400 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#FF5C38]" />
                        <span className="break-words">
                          {partner.spottingClue?.trim()
                            ? partner.spottingClue
                            : "No spotting clue listed — call out their name!"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 2 "Why You Matched" Rarity Highlights (Warm Amber accent) */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.15em] text-[#F59E0B]">
                  <Sparkles className="w-3.5 h-3.5" />
                  Why You Matched
                </div>
                {match.sharedHighlights.map((highlight, idx) => (
                  <div
                    key={`${highlight.questionId}-${idx}`}
                    className="p-3.5 rounded-xl bg-[#F59E0B]/[0.07] border border-[#F59E0B]/25 space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2 py-0.5 rounded bg-[#121214] border border-[#F59E0B]/30 text-[#F59E0B] text-[10px] font-bold uppercase tracking-wider">
                        {highlight.topicTag}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                        Rare Signal
                      </span>
                    </div>
                    <p className="text-sm text-[#F5F4F0]/90 leading-snug">
                      {highlight.description}
                    </p>
                  </div>
                ))}
              </div>

              {/* 1 "Spicy Difference" Callout (Persimmon Coral + Flame icon badge) */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.15em] text-[#FF5C38]">
                  <Flame className="w-3.5 h-3.5" />
                  Spicy Difference
                </div>
                <div className="p-3.5 rounded-xl bg-[#FF5C38]/[0.08] border border-[#FF5C38]/30 space-y-1.5">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#FF5C38] text-[#121214] text-[10px] font-extrabold uppercase tracking-wider">
                    <Flame className="w-3 h-3" />
                    {match.spicyDifference.topicTag}
                  </span>
                  <p className="text-sm text-[#F5F4F0]/90 leading-snug">
                    {match.spicyDifference.description}
                  </p>
                </div>
              </div>

              {/* Optional "Your Worst Enemy" Bonus Nemesis Section */}
              {worstEnemy && (
                <div className="pt-4 border-t border-dashed border-white/[0.14] space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-300">
                      <Skull className="w-3.5 h-3.5 text-[#FF5C38]" />
                      Your Worst Enemy
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#121214] border border-[#FF5C38]/40 text-[#FF5C38] text-xs font-bold tabular-nums">
                      {worstEnemy.compatibility}% Match
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#121214] border border-white/[0.1] space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 shrink-0 rounded-xl bg-[#FF5C38]/15 border border-[#FF5C38]/35 flex items-center justify-center text-2xl">
                        {worstEnemy.enemy.avatar}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#F59E0B]">
                          Least Similar in the Room
                        </div>
                        <div className="font-display font-bold text-lg text-[#F5F4F0] truncate">
                          {worstEnemy.enemy.name}
                        </div>
                        <div className="flex items-start gap-1 text-xs text-zinc-400 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#FF5C38]" />
                          <span className="break-words">
                            {worstEnemy.enemy.spottingClue?.trim()
                              ? worstEnemy.enemy.spottingClue
                              : "No spotting clue listed — keep your guard up."}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-[#1A1A1E] border border-white/[0.07] space-y-1">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#F59E0B]/15 text-[#F59E0B] text-[10px] font-bold uppercase tracking-wider">
                        <Flame className="w-3 h-3" />
                        Biggest Clash: {worstEnemy.biggestClash.topicTag}
                      </span>
                      <p className="text-xs sm:text-sm text-zinc-300 leading-snug">
                        {worstEnemy.biggestClash.description}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
