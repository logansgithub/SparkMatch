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
  const currentValue = currentQuestion ? answers[currentQuestion.id] : undefined;
  const isLast = currentIndex === total - 1;
  const progressPct = total > 0 ? Math.round(((currentIndex + 1) / total) * 100) : 0;

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

  return (
    <div className="w-full max-w-md mx-auto px-4 py-6">
      {/* Top progress header */}
      <div className="mb-5 space-y-2">
        <div className="flex items-center justify-between text-xs font-display font-bold">
          <span className="px-2.5 py-1 rounded-lg bg-white border-2 border-ink shadow-riso-sm">
            ROOM {roomCode}
          </span>
          <span className="text-ink/80">
            Question {currentIndex + 1} of {total}
          </span>
        </div>

        <div className="w-full h-3.5 rounded-full bg-white border-2 border-ink overflow-hidden">
          <motion.div
            className="h-full bg-coral"
            initial={false}
            animate={{ width: `${progressPct}%` }}
            transition={{ type: "spring", stiffness: 260, damping: 28 }}
          />
        </div>
      </div>

      {/* Animated Question Card */}
      <div className="relative overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentQuestion.id}
            custom={direction}
            initial={{ opacity: 0, x: direction > 0 ? 48 : -48 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction > 0 ? -48 : 48 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="riso-card p-6 space-y-6"
          >
            <div>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-marigold/60 border-2 border-ink text-[11px] font-display font-bold uppercase tracking-wider mb-3">
                <Sparkles className="w-3 h-3" />
                {currentQuestion.topicTag}
              </span>
              <h2 className="text-xl sm:text-2xl font-display font-bold leading-snug text-ink">
                {currentQuestion.prompt}
              </h2>
            </div>

            {currentQuestion.type === "choice" && currentQuestion.options ? (
              <div className="space-y-3">
                {currentQuestion.options.map((opt, idx) => {
                  const selected = currentValue === idx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelect(idx)}
                      className={`w-full min-h-[54px] px-4 py-3 rounded-xl border-2 border-ink text-left flex items-center gap-3 transition-all ${
                        selected
                          ? "bg-indigoParty text-white shadow-riso translate-x-[-1px] translate-y-[-1px]"
                          : "bg-cream text-ink hover:bg-marigold/30"
                      }`}
                    >
                      <span
                        className={`w-8 h-8 shrink-0 rounded-lg border-2 border-ink font-display font-bold text-sm flex items-center justify-center ${
                          selected
                            ? "bg-marigold text-ink"
                            : "bg-white text-ink"
                        }`}
                      >
                        {CHOICE_LETTERS[idx] ?? idx + 1}
                      </span>
                      <span className="font-semibold text-sm sm:text-base leading-snug flex-1">
                        {opt}
                      </span>
                      {selected && <Check className="w-5 h-5 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-4 py-2">
                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5].map((num) => {
                    const selected = currentValue === num;
                    return (
                      <button
                        key={num}
                        type="button"
                        onClick={() => handleSelect(num)}
                        aria-label={`Rate ${num} out of 5`}
                        className={`min-h-[56px] rounded-xl border-2 border-ink font-display font-bold text-xl transition-all flex items-center justify-center ${
                          selected
                            ? "bg-coral text-white shadow-riso -translate-y-0.5"
                            : "bg-cream text-ink hover:bg-marigold/40"
                        }`}
                      >
                        {num}
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-start justify-between gap-4 text-xs font-display font-bold text-ink/75">
                  <span className="max-w-[44%] leading-tight">
                    1 — {currentQuestion.lowLabel}
                  </span>
                  <span className="max-w-[44%] text-right leading-tight">
                    5 — {currentQuestion.highLabel}
                  </span>
                </div>
              </div>
            )}

            {/* Navigation Footer */}
            <div className="flex items-center gap-3 pt-2">
              {currentIndex > 0 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="riso-btn-white px-4"
                  aria-label="Previous question"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              <button
                type="button"
                onClick={handleNext}
                disabled={currentValue === undefined || submitting}
                className={`flex-1 text-base ${
                  isLast ? "riso-btn-coral" : "riso-btn-marigold"
                }`}
              >
                {submitting
                  ? "Locking In..."
                  : isLast
                  ? "Lock In My Answers"
                  : "Next Question"}
                {isLast ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <ArrowRight className="w-5 h-5" />
                )}
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
