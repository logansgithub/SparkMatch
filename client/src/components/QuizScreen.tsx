import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Sparkles } from "lucide-react";
import { Question } from "../types";

interface QuizScreenProps {
  roomCode: string;
  questions: Question[];
  onSubmitAnswers: (answers: Record<string, number>) => Promise<void>;
}

const CHOICE_LETTERS = ["A", "B", "C", "D"];

export const QuizScreen: React.FC<QuizScreenProps> = ({
  roomCode,
  questions,
  onSubmitAnswers,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);

  const currentQuestion = questions[currentIndex];
  const total = questions.length;
  const currentValue = currentQuestion
    ? answers[currentQuestion.id]
    : undefined;
  const isLast = currentIndex === total - 1;
  const progressPct =
    total > 0 ? Math.round(((currentIndex + 1) / total) * 100) : 0;

  if (!currentQuestion) {
    return null;
  }

  const handleSelect = (val: number) => {
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: val }));
  };

  const handleNext = async () => {
    if (currentValue === undefined) return;
    if (!isLast) {
      setDirection(1);
      setCurrentIndex((i) => i + 1);
      return;
    }

    setSubmitting(true);
    try {
      await onSubmitAnswers(answers);
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setDirection(-1);
      setCurrentIndex((i) => i - 1);
    }
  };

  const paddedIndex = String(currentIndex + 1).padStart(2, "0");
  const paddedTotal = String(total).padStart(2, "0");

  return (
    <div className="w-full max-w-md mx-auto px-4 py-6">
      {/* Deck Progress Header */}
      <div className="mb-5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="px-2.5 py-1 rounded-lg bg-[#1A1A1E] border border-white/[0.1] font-display font-bold text-xs tracking-widest text-[#F5F4F0]">
            {roomCode}
          </span>
          <span className="text-xs font-bold tracking-wider uppercase text-zinc-400 tabular-nums">
            Card{" "}
            <span className="text-[#F5F4F0]">
              {paddedIndex} / {paddedTotal}
            </span>
          </span>
        </div>

        <div className="w-full h-1.5 rounded-full bg-[#1A1A1E] overflow-hidden border border-white/[0.06]">
          <motion.div
            className="h-full bg-[#FF5C38] rounded-full"
            initial={false}
            animate={{ width: `${progressPct}%` }}
            transition={{ type: "spring", stiffness: 260, damping: 28 }}
          />
        </div>
      </div>

      {/* Layered Mobile Card Deck */}
      <div className="relative pb-3">
        {/* Subtle stacked card edges behind active card */}
        {!isLast && (
          <>
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-4 bottom-0 h-6 rounded-b-2xl bg-[#16161A] border border-white/[0.06]"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-2 bottom-1.5 h-6 rounded-b-2xl bg-[#18181C] border border-white/[0.07]"
            />
          </>
        )}

        <div className="relative overflow-hidden rounded-2xl">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentQuestion.id}
              custom={direction}
              initial={{ opacity: 0, x: direction > 0 ? 52 : -52 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction > 0 ? -52 : 52 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="editorial-card p-6 sm:p-7 space-y-7"
            >
              {/* Topic Tag & Question Prompt */}
              <div className="space-y-3">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F59E0B]/15 border border-[#F59E0B]/30 text-[#F59E0B] text-[11px] font-bold uppercase tracking-[0.14em]">
                  <Sparkles className="w-3 h-3" />
                  {currentQuestion.topicTag}
                </span>
                <h2 className="text-xl sm:text-2xl font-display font-bold leading-snug text-[#F5F4F0]">
                  {currentQuestion.prompt}
                </h2>
              </div>

              {/* Choice Cards vs. Tactile 5-Step Segmented Pill Selector */}
              {currentQuestion.type === "choice" && currentQuestion.options ? (
                <div className="space-y-2.5">
                  {currentQuestion.options.map((opt, idx) => {
                    const selected = currentValue === idx;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelect(idx)}
                        className={`w-full min-h-[56px] px-4 py-3.5 rounded-xl border text-left flex items-center gap-3.5 transition-all duration-150 active:scale-[0.98] ${
                          selected
                            ? "bg-[#FF5C38]/15 border-[#FF5C38] text-[#F5F4F0]"
                            : "bg-[#121214] border-white/[0.09] text-zinc-200 hover:border-white/30 hover:bg-[#17171B]"
                        }`}
                      >
                        <span
                          className={`w-8 h-8 shrink-0 rounded-lg border font-display font-bold text-xs flex items-center justify-center transition-colors ${
                            selected
                              ? "bg-[#FF5C38] border-[#FF5C38] text-[#121214]"
                              : "bg-[#1A1A1E] border-white/[0.12] text-zinc-400"
                          }`}
                        >
                          {CHOICE_LETTERS[idx] ?? idx + 1}
                        </span>
                        <span className="font-semibold text-sm sm:text-[15px] leading-snug flex-1">
                          {opt}
                        </span>
                        {selected && (
                          <Check className="w-4 h-4 text-[#FF5C38] shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-5 py-2">
                  {/* Tactile 5-step segmented selector with discrete track markings */}
                  <div className="relative">
                    {/* Discrete track line connecting all 5 steps */}
                    <div
                      aria-hidden="true"
                      className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-[2px] bg-white/[0.1] rounded-full"
                    />
                    {currentValue !== undefined && (
                      <motion.div
                        aria-hidden="true"
                        className="absolute left-6 top-1/2 -translate-y-1/2 h-[2px] bg-[#FF5C38] rounded-full"
                        initial={false}
                        animate={{
                          width: `calc(${((currentValue - 1) / 4) * 100}% - ${
                            ((currentValue - 1) / 4) * 3
                          }rem)`,
                        }}
                        transition={{ type: "spring", stiffness: 320, damping: 28 }}
                      />
                    )}

                    <div
                      role="radiogroup"
                      aria-label={currentQuestion.prompt}
                      className="relative grid grid-cols-5 gap-2"
                    >
                      {[1, 2, 3, 4, 5].map((num) => {
                        const selected = currentValue === num;
                        return (
                          <button
                            key={num}
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            aria-label={`Rate ${num} out of 5`}
                            onClick={() => handleSelect(num)}
                            className={`relative min-h-[56px] rounded-xl border font-display font-extrabold text-xl tabular-nums transition-all duration-150 active:scale-[0.95] flex flex-col items-center justify-center ${
                              selected
                                ? "bg-[#FF5C38] border-[#FF5C38] text-[#121214] shadow-[0_4px_18px_rgba(255,92,56,0.3)] -translate-y-0.5"
                                : "bg-[#121214] border-white/[0.12] text-zinc-300 hover:border-white/30"
                            }`}
                          >
                            <span>{num}</span>
                            <span
                              aria-hidden="true"
                              className={`mt-1 w-1 h-1 rounded-full ${
                                selected ? "bg-[#121214]" : "bg-white/25"
                              }`}
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Editorial Low / High Anchor Labels */}
                  <div className="flex items-start justify-between gap-4 pt-1">
                    <div className="max-w-[46%]">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                        1 — Low
                      </div>
                      <div className="text-xs font-semibold text-zinc-300 leading-snug mt-0.5">
                        {currentQuestion.lowLabel}
                      </div>
                    </div>
                    <div className="max-w-[46%] text-right">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-[#F59E0B]">
                        5 — High
                      </div>
                      <div className="text-xs font-semibold text-zinc-300 leading-snug mt-0.5">
                        {currentQuestion.highLabel}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Footer */}
              <div className="flex items-center gap-3 pt-1">
                {currentIndex > 0 && (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="editorial-btn-secondary px-4 shrink-0"
                    aria-label="Previous question"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={currentValue === undefined || submitting}
                  className="editorial-btn-primary flex-1"
                >
                  {submitting
                    ? "Locking In..."
                    : isLast
                    ? "Lock In My Answers"
                    : "Next Question"}
                  {isLast ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <ArrowRight className="w-4 h-4" />
                  )}
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
