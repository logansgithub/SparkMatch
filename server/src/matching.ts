import {
  MatchGroup,
  MatchInsight,
  Player,
  Question,
  WorstEnemyInfo,
} from "./types";

const POLARIZED_STANCE_MAP: Record<number, number> = {
  1: -2.0,
  2: -1.2,
  3: 0.0,
  4: 1.2,
  5: 2.0,
};

const MAX_STANCE_DISTANCE = 4.0;

/**
 * Non-linear Polarized Stance Mapping for 1..5 scale questions.
 * Rewards agreement on the same side of neutral (e.g., 4 vs 5 = 0.80 > 4 vs 3 = 0.70)
 * and penalizes crossing the disagree/agree divide (2 vs 4 = 0.40).
 */
export function calculateScaleSimilarity(a: number, b: number): number {
  const clampedA = Math.max(1, Math.min(5, Math.round(a)));
  const clampedB = Math.max(1, Math.min(5, Math.round(b)));
  const posA = POLARIZED_STANCE_MAP[clampedA] ?? 0.0;
  const posB = POLARIZED_STANCE_MAP[clampedB] ?? 0.0;
  const similarity = 1 - Math.abs(posA - posB) / MAX_STANCE_DISTANCE;
  return Math.max(0, Math.round(similarity * 10000) / 10000);
}

/**
 * Step 1: Question-level similarity in [0, 1].
 * - scale (1..5): non-linear Polarized Stance Mapping
 * - choice (0..3): 1 if a === b else 0
 */
export function computeQuestionSimilarity(
  question: Question,
  a: number,
  b: number
): number {
  if (question.type === "scale") {
    return calculateScaleSimilarity(a, b);
  }
  return a === b ? 1 : 0;
}

/**
 * Step 1: Raw pairwise compatibility score (0..100 integer).
 */
export function computePairwiseScore(
  playerA: Player,
  playerB: Player,
  questions: Question[]
): number {
  let sum = 0;
  let count = 0;

  for (const q of questions) {
    const a = playerA.answers[q.id];
    const b = playerB.answers[q.id];
    if (typeof a === "number" && typeof b === "number") {
      sum += computeQuestionSimilarity(q, a, b);
      count += 1;
    }
  }

  if (count === 0) return 0;
  return Math.round(100 * (sum / count));
}

/**
 * Step 2: Welfare-adjusted edge weight.
 * Heavily penalizes miserable matches (< 40%) so the optimizer protects everyone.
 */
export function welfareWeight(score: number): number {
  return score - (score < 40 ? (40 - score) * 1.5 : 0);
}

/**
 * Exact Global Maximum Weight Perfect Matching via Bitmask Dynamic Programming.
 * Valid for even N with 2 <= N <= 16.
 * Pins the lowest unset bit i and tries every unset partner j > i.
 */
export function solveEvenMatchingExact(
  weights: number[][]
): Array<[number, number]> {
  const n = weights.length;
  if (n === 0) return [];
  if (n % 2 !== 0) {
    throw new Error(`solveEvenMatchingExact requires even N, received ${n}`);
  }
  if (n > 16) {
    throw new Error(`solveEvenMatchingExact supports N <= 16, received ${n}`);
  }

  const totalMasks = 1 << n;
  const dp = new Float64Array(totalMasks);
  const visited = new Uint8Array(totalMasks);
  const partnerChoice = new Int8Array(totalMasks).fill(-1);

  const fullMask = totalMasks - 1;

  // dp[mask] = maximum total weight pairing all UNSET bits in `mask`
  // Wait: convention below uses `mask` = bitmask of ALREADY MATCHED players,
  // starting from 0 and ending at fullMask!
  // Base case: mask === fullMask -> 0.
  dp[fullMask] = 0;
  visited[fullMask] = 1;

  function solve(matchedMask: number): number {
    if (visited[matchedMask]) {
      return dp[matchedMask];
    }

    const unsetMask = fullMask ^ matchedMask;
    // Pin lowest unset bit i
    const lowestBit = unsetMask & -unsetMask;
    const i = 31 - Math.clz32(lowestBit);

    let bestWeight = -Infinity;
    let bestJ = -1;

    let candidates = unsetMask ^ lowestBit;
    while (candidates !== 0) {
      const bitJ = candidates & -candidates;
      const j = 31 - Math.clz32(bitJ);
      const nextMask = matchedMask | lowestBit | bitJ;
      const candidateWeight = weights[i][j] + solve(nextMask);
      if (candidateWeight > bestWeight) {
        bestWeight = candidateWeight;
        bestJ = j;
      }
      candidates ^= bitJ;
    }

    visited[matchedMask] = 1;
    dp[matchedMask] = bestWeight;
    partnerChoice[matchedMask] = bestJ;
    return bestWeight;
  }

  solve(0);

  const pairs: Array<[number, number]> = [];
  let mask = 0;
  while (mask !== fullMask) {
    const unsetMask = fullMask ^ mask;
    const lowestBit = unsetMask & -unsetMask;
    const i = 31 - Math.clz32(lowestBit);
    const j = partnerChoice[mask];
    pairs.push([i, j]);
    mask |= lowestBit | (1 << j);
  }

  return pairs;
}

/**
 * Multi-start 2-opt pairwise swap optimization for even N > 16.
 * Runs `restarts` (default 30) randomized initial matchings and applies
 * strictly improving 2-opt pair swaps until convergence, returning the highest total.
 */
export function solveEvenMatchingTwoOpt(
  weights: number[][],
  restarts = 30,
  rng: () => number = Math.random
): Array<[number, number]> {
  const n = weights.length;
  if (n === 0) return [];
  if (n % 2 !== 0) {
    throw new Error(`solveEvenMatchingTwoOpt requires even N, received ${n}`);
  }

  const pairCount = n / 2;
  let globalBestPairs: Array<[number, number]> = [];
  let globalBestWeight = -Infinity;

  const EPS = 1e-9;

  for (let r = 0; r < restarts; r++) {
    const perm = Array.from({ length: n }, (_, idx) => idx);
    // Fisher-Yates shuffle
    for (let i = n - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      const tmp = perm[i];
      perm[i] = perm[j];
      perm[j] = tmp;
    }

    const pairs: Array<[number, number]> = [];
    for (let p = 0; p < pairCount; p++) {
      pairs.push([perm[2 * p], perm[2 * p + 1]]);
    }

    let improved = true;
    while (improved) {
      improved = false;
      for (let p = 0; p < pairCount; p++) {
        for (let q = p + 1; q < pairCount; q++) {
          const [a, b] = pairs[p];
          const [c, d] = pairs[q];
          const current = weights[a][b] + weights[c][d];
          const opt1 = weights[a][c] + weights[b][d];
          const opt2 = weights[a][d] + weights[b][c];

          if (opt1 > current + EPS && opt1 >= opt2) {
            pairs[p] = [a, c];
            pairs[q] = [b, d];
            improved = true;
          } else if (opt2 > current + EPS) {
            pairs[p] = [a, d];
            pairs[q] = [b, c];
            improved = true;
          }
        }
      }
    }

    let total = 0;
    for (const [a, b] of pairs) {
      total += weights[a][b];
    }

    if (total > globalBestWeight) {
      globalBestWeight = total;
      globalBestPairs = pairs.map(([a, b]) => [a, b]);
    }
  }

  return globalBestPairs;
}

function solveEvenWeights(weights: number[][]): Array<[number, number]> {
  if (weights.length <= 16) {
    return solveEvenMatchingExact(weights);
  }
  return solveEvenMatchingTwoOpt(weights, 30);
}

/**
 * Step 3: Global Maximum Weight Matching for any N >= 2 (even pairs, or odd with 1 trio).
 * Operates on a symmetric N x N weight matrix and returns index groups + combined weight.
 */
export function solveOptimalMatchingIndices(weights: number[][]): {
  groups: number[][];
  totalWeight: number;
} {
  const n = weights.length;
  if (n < 2) {
    throw new Error("At least 2 players are required to compute matches.");
  }

  // Even N: all pairs
  if (n % 2 === 0) {
    const pairs = solveEvenWeights(weights);
    let totalWeight = 0;
    for (const [a, b] of pairs) {
      totalWeight += weights[a][b];
    }
    return {
      groups: pairs.map(([a, b]) => [a, b]),
      totalWeight,
    };
  }

  // Odd N === 3: single trio
  if (n === 3) {
    const trioAvg = (weights[0][1] + weights[0][2] + weights[1][2]) / 3;
    return {
      groups: [[0, 1, 2]],
      totalWeight: trioAvg,
    };
  }

  // Odd N >= 5: iterate over every candidate third wheel t in 0..N-1
  let bestGroups: number[][] = [];
  let bestTotalWeight = -Infinity;

  for (let t = 0; t < n; t++) {
    // Build index mapping for remaining N - 1 players
    const remIndices: number[] = [];
    for (let i = 0; i < n; i++) {
      if (i !== t) remIndices.push(i);
    }

    const subN = remIndices.length;
    const subWeights: number[][] = Array.from({ length: subN }, (_, r) =>
      Array.from({ length: subN }, (_, c) =>
        r === c ? 0 : weights[remIndices[r]][remIndices[c]]
      )
    );

    const subPairs = solveEvenWeights(subWeights);
    const mappedPairs: Array<[number, number]> = subPairs.map(([a, b]) => [
      remIndices[a],
      remIndices[b],
    ]);

    let basePairWeightSum = 0;
    for (const [u, v] of mappedPairs) {
      basePairWeightSum += weights[u][v];
    }

    // Attach t to whichever pair (u, v) maximizes trioAvg - w(u, v)
    let bestPairIdx = 0;
    let bestDelta = -Infinity;
    for (let idx = 0; idx < mappedPairs.length; idx++) {
      const [u, v] = mappedPairs[idx];
      const trioAvg = (weights[u][v] + weights[u][t] + weights[v][t]) / 3;
      const delta = trioAvg - weights[u][v];
      if (delta > bestDelta) {
        bestDelta = delta;
        bestPairIdx = idx;
      }
    }

    const combinedWeight = basePairWeightSum + bestDelta;
    if (combinedWeight > bestTotalWeight) {
      bestTotalWeight = combinedWeight;
      bestGroups = mappedPairs.map(([u, v], idx) =>
        idx === bestPairIdx ? [u, v, t] : [u, v]
      );
    }
  }

  return {
    groups: bestGroups,
    totalWeight: bestTotalWeight,
  };
}

// ---------- Step 4: Rarity-Weighted Match Insights ----------

interface RoomAnswerStats {
  counts: Map<string, Map<number, number>>;
  totals: Map<string, number>;
}

function buildRoomAnswerStats(
  players: Player[],
  questions: Question[]
): RoomAnswerStats {
  const counts = new Map<string, Map<number, number>>();
  const totals = new Map<string, number>();

  for (const q of questions) {
    const qMap = new Map<number, number>();
    let total = 0;
    for (const p of players) {
      const ans = p.answers[q.id];
      if (typeof ans === "number") {
        qMap.set(ans, (qMap.get(ans) ?? 0) + 1);
        total += 1;
      }
    }
    counts.set(q.id, qMap);
    totals.set(q.id, total);
  }

  return { counts, totals };
}

function getFrequency(
  stats: RoomAnswerStats,
  questionId: string,
  value: number
): { count: number; total: number; freq: number } {
  const total = stats.totals.get(questionId) ?? 0;
  const count = stats.counts.get(questionId)?.get(value) ?? 0;
  return {
    count,
    total,
    freq: total > 0 ? count / total : 0,
  };
}

function formatAnswerValue(question: Question, value: number): string {
  if (question.type === "choice" && question.options) {
    return question.options[value] ?? `Option ${value + 1}`;
  }
  // Scale 1..5
  if (value <= 1 && question.lowLabel) return `1/5 (${question.lowLabel})`;
  if (value >= 5 && question.highLabel) return `5/5 (${question.highLabel})`;
  if (value === 2 && question.lowLabel) return `2/5 (leaning "${question.lowLabel}")`;
  if (value === 4 && question.highLabel) return `4/5 (leaning "${question.highLabel}")`;
  return `${value}/5`;
}

function formatSharedDescription(
  question: Question,
  values: number[],
  stats: RoomAnswerStats
): string {
  const groupSize = values.length;
  const allEqual = values.every((v) => v === values[0]);
  const groupWord = groupSize === 2 ? "both" : "all three";
  const onlyGroupWord = groupSize === 2 ? "two" : "three";

  if (allEqual) {
    const val = values[0];
    const { count, total } = getFrequency(stats, question.id, val);
    const label = formatAnswerValue(question, val);

    if (question.type === "choice") {
      if (count <= groupSize) {
        return `You're the only ${onlyGroupWord} in the room who picked "${label}" for ${question.topicTag}!`;
      }
      return `Only ${count} of ${total} people picked "${label}" for ${question.topicTag} — and you're ${groupWord} here.`;
    }

    // Scale exact match
    if (count <= groupSize) {
      return `You're the only ${onlyGroupWord} in the room who rated ${question.topicTag} a ${label}!`;
    }
    return `Only ${count} of ${total} people rated ${question.topicTag} a ${label} — exact wavelength.`;
  }

  // Close scale match (within 1 point)
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const leaning =
    avg >= 3.5 && question.highLabel
      ? ` — both vibing with "${question.highLabel}"`
      : avg <= 2.5 && question.lowLabel
      ? ` — both leaning "${question.lowLabel}"`
      : "";
  return `Nearly identical energy on ${question.topicTag} (${minVal}/5 and ${maxVal}/5)${leaning}.`;
}

function formatDifferenceDescription(
  question: Question,
  groupPlayers: Player[],
  values: number[],
  allSame: boolean
): string {
  if (allSame) {
    return `Eerily aligned on ${question.topicTag} too — we couldn't even find a real argument to start!`;
  }

  if (groupPlayers.length === 2) {
    const [pA, pB] = groupPlayers;
    const [vA, vB] = values;
    if (question.type === "choice") {
      return `${pA.name} went with "${formatAnswerValue(question, vA)}", while ${pB.name} picked "${formatAnswerValue(question, vB)}" — let the debate begin.`;
    }
    return `${pA.name} scored ${formatAnswerValue(question, vA)} while ${pB.name} scored ${formatAnswerValue(question, vB)} — classic opposites.`;
  }

  // Trio difference
  const parts = groupPlayers.map((p, idx) => {
    const label =
      question.type === "choice"
        ? `"${formatAnswerValue(question, values[idx])}"`
        : formatAnswerValue(question, values[idx]);
    return `${p.name}: ${label}`;
  });
  return `Spicy split on ${question.topicTag} — ${parts.join(" vs. ")}.`;
}

export function computeGroupInsights(
  groupPlayers: Player[],
  allRoomPlayers: Player[],
  questions: Question[]
): { sharedHighlights: MatchInsight[]; spicyDifference: MatchInsight } {
  const stats = buildRoomAnswerStats(allRoomPlayers, questions);

  interface SharedCandidate {
    insight: MatchInsight;
    priority: number; // 2 = exact/close agreement, 1 = fallback high similarity
    similarity: number;
  }

  interface DiffCandidate {
    insight: MatchInsight;
    avgSim: number;
    maxScaleGap: number;
    avgFreq: number;
  }

  const sharedCandidates: SharedCandidate[] = [];
  const diffCandidates: DiffCandidate[] = [];

  for (const q of questions) {
    const vals: number[] = [];
    let valid = true;
    for (const p of groupPlayers) {
      const v = p.answers[q.id];
      if (typeof v !== "number") {
        valid = false;
        break;
      }
      vals.push(v);
    }
    if (!valid) continue;

    // Pairwise average similarity within the group
    let simSum = 0;
    let pairCount = 0;
    let maxGap = 0;
    for (let i = 0; i < vals.length; i++) {
      for (let j = i + 1; j < vals.length; j++) {
        simSum += computeQuestionSimilarity(q, vals[i], vals[j]);
        pairCount += 1;
        if (q.type === "scale") {
          maxGap = Math.max(maxGap, Math.abs(vals[i] - vals[j]));
        }
      }
    }
    const avgSim = pairCount > 0 ? simSum / pairCount : 0;

    const freqs = vals.map((v) => getFrequency(stats, q.id, v).freq);
    const avgFreq = freqs.reduce((a, b) => a + b, 0) / freqs.length;

    const allEqual = vals.every((v) => v === vals[0]);
    const isCloseScale =
      !allEqual &&
      q.type === "scale" &&
      Math.max(...vals) - Math.min(...vals) === 1;

    if (allEqual) {
      const f = getFrequency(stats, q.id, vals[0]).freq;
      const choiceBonus = q.type === "choice" ? 0.05 : 0;
      const rarityScore = Number(((1 - f) + choiceBonus).toFixed(4));
      sharedCandidates.push({
        priority: 2,
        similarity: avgSim,
        insight: {
          questionId: q.id,
          topicTag: q.topicTag,
          description: formatSharedDescription(q, vals, stats),
          rarityScore,
        },
      });
    } else if (isCloseScale) {
      const rarityScore = Number((0.5 * (1 - avgFreq)).toFixed(4));
      sharedCandidates.push({
        priority: 2,
        similarity: avgSim,
        insight: {
          questionId: q.id,
          topicTag: q.topicTag,
          description: formatSharedDescription(q, vals, stats),
          rarityScore,
        },
      });
    } else {
      // Fallback candidate in case the group has fewer than 2 exact/close agreements
      const rarityScore = Number((avgSim * 0.25 * (1 - avgFreq)).toFixed(4));
      sharedCandidates.push({
        priority: 1,
        similarity: avgSim,
        insight: {
          questionId: q.id,
          topicTag: q.topicTag,
          description: `Closest common ground on ${q.topicTag} — plenty of room to compare notes!`,
          rarityScore,
        },
      });
    }

    diffCandidates.push({
      avgSim,
      maxScaleGap: maxGap,
      avgFreq,
      insight: {
        questionId: q.id,
        topicTag: q.topicTag,
        description: formatDifferenceDescription(q, groupPlayers, vals, allEqual),
        rarityScore: Number((1 - avgFreq).toFixed(4)),
      },
    });
  }

  // Sort shared highlights: actual agreements first, then highest rarityScore, then similarity
  sharedCandidates.sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority;
    if (b.insight.rarityScore !== a.insight.rarityScore) {
      return b.insight.rarityScore - a.insight.rarityScore;
    }
    return b.similarity - a.similarity;
  });

  const sharedHighlights = sharedCandidates
    .slice(0, 2)
    .map((c) => c.insight);

  // Sort spicy difference: lowest similarity first, tie-break by largest scale gap, then rarest combined picks (lowest avgFreq)
  diffCandidates.sort((a, b) => {
    if (a.avgSim !== b.avgSim) return a.avgSim - b.avgSim;
    if (b.maxScaleGap !== a.maxScaleGap) return b.maxScaleGap - a.maxScaleGap;
    return a.avgFreq - b.avgFreq;
  });

  const spicyDifference: MatchInsight =
    diffCandidates[0]?.insight ?? {
      questionId: questions[0]?.id ?? "q1",
      topicTag: questions[0]?.topicTag ?? "Wildcard",
      description: "Total mystery — ask each other about your boldest hot take!",
      rarityScore: 0.5,
    };

  return { sharedHighlights, spicyDifference };
}

/**
 * Full end-to-end room matching pipeline:
 * 1. Pairwise scores (0..100)
 * 2. Welfare-adjusted weights
 * 3. Global optimal matching (Bitmask DP for N <= 16, Multi-start 2-opt for N > 16, optimal trio for odd N)
 * 4. Rarity-weighted highlights + spicy difference
 */
export function computeRoomMatches(
  players: Player[],
  questions: Question[]
): MatchGroup[] {
  const n = players.length;
  if (n < 2) {
    throw new Error("Need at least 2 completed players to generate matches.");
  }

  const rawScores: number[][] = Array.from({ length: n }, () =>
    Array(n).fill(0)
  );
  const weights: number[][] = Array.from({ length: n }, () =>
    Array(n).fill(0)
  );

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const score = computePairwiseScore(players[i], players[j], questions);
      const w = welfareWeight(score);
      rawScores[i][j] = score;
      rawScores[j][i] = score;
      weights[i][j] = w;
      weights[j][i] = w;
    }
  }

  const { groups } = solveOptimalMatchingIndices(weights);

  return groups.map((indices) => {
    const groupPlayers = indices.map((idx) => players[idx]);
    let compatibility = 0;
    if (indices.length === 2) {
      compatibility = rawScores[indices[0]][indices[1]];
    } else if (indices.length === 3) {
      const [a, b, c] = indices;
      compatibility = Math.round(
        (rawScores[a][b] + rawScores[a][c] + rawScores[b][c]) / 3
      );
    }

    const { sharedHighlights, spicyDifference } = computeGroupInsights(
      groupPlayers,
      players,
      questions
    );

    return {
      playerIds: groupPlayers.map((p) => p.id),
      compatibility,
      sharedHighlights,
      spicyDifference,
    };
  });
}

/**
 * Computes each player's "Worst Enemy": the person in the room LEAST similar
 * to them based on pairwise quiz compatibility (0..100).
 * When non-partner candidates exist (rooms of 4+), excludes the player's own
 * SparkMatch partner(s) so a player is never matched with their own nemesis.
 */
export function computeWorstEnemies(
  players: Player[],
  questions: Question[],
  matches: MatchGroup[] = []
): Map<string, WorstEnemyInfo> {
  const result = new Map<string, WorstEnemyInfo>();
  const n = players.length;
  if (n < 2) return result;

  const partnerMap = new Map<string, Set<string>>();
  for (const group of matches) {
    for (const pid of group.playerIds) {
      const others = partnerMap.get(pid) ?? new Set<string>();
      for (const otherId of group.playerIds) {
        if (otherId !== pid) others.add(otherId);
      }
      partnerMap.set(pid, others);
    }
  }

  for (let i = 0; i < n; i++) {
    const player = players[i];
    const partners = partnerMap.get(player.id) ?? new Set<string>();

    const nonPartnerIndices: number[] = [];
    const allOtherIndices: number[] = [];
    for (let j = 0; j < n; j++) {
      if (j === i) continue;
      allOtherIndices.push(j);
      if (!partners.has(players[j].id)) {
        nonPartnerIndices.push(j);
      }
    }

    const candidates =
      nonPartnerIndices.length > 0 ? nonPartnerIndices : allOtherIndices;

    let worstIdx = candidates[0];
    let worstScore = Infinity;
    let worstExactMatches = Infinity;

    for (const j of candidates) {
      const score = computePairwiseScore(player, players[j], questions);
      // Tie-breaker: fewest exact question matches
      let exactMatches = 0;
      for (const q of questions) {
        const a = player.answers[q.id];
        const b = players[j].answers[q.id];
        if (typeof a === "number" && typeof b === "number" && a === b) {
          exactMatches += 1;
        }
      }

      if (
        score < worstScore ||
        (score === worstScore && exactMatches < worstExactMatches)
      ) {
        worstScore = score;
        worstExactMatches = exactMatches;
        worstIdx = j;
      }
    }

    const enemy = players[worstIdx];
    const { spicyDifference } = computeGroupInsights(
      [player, enemy],
      players,
      questions
    );

    result.set(player.id, {
      enemyId: enemy.id,
      compatibility: worstScore,
      biggestClash: spicyDifference,
    });
  }

  return result;
}
