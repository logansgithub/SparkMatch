import { DEFAULT_PACK_ID, getQuestionPackOrDefault } from "./questionPacks";
import { Question } from "./types";

/**
 * SparkMatch Default Question Bank ("House Party Chaos")
 *
 * To customize or add multi-event decks, edit `server/src/questionPacks.ts`.
 */
export const QUESTIONS: Question[] =
  getQuestionPackOrDefault(DEFAULT_PACK_ID).questions;
