import { describe, expect, it } from "vitest";
import {
  computeGroupInsights,
  computePairwiseScore,
  computeRoomMatches,
  computeWorstEnemies,
  solveEvenMatchingExact,
  solveOptimalMatchingIndices,
  welfareWeight,
} from "./matching";
import { QUESTIONS } from "./questions";
import { Player, Question } from "./types";

function makePlayer(
  id: string,
  name: string,
  answers: Record<string, number>
): Player {
  return {
    id,
    socketId: null,
    name,
    avatar: "✨",
    spottingClue: "",
    isHost: false,
    isBot: false,
    connected: true,
    answers,
    quizCompleted: true,
  };
}

function makeSeededRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function makeRandomPlayers(count: number, seed = 42): Player[] {
  const rng = makeSeededRng(seed);
  return Array.from({ length: count }, (_, idx) => {
    const answers: Record<string, number> = {};
    for (const q of QUESTIONS) {
      if (q.type === "scale") {
        answers[q.id] = Math.floor(rng() * 5) + 1;
      } else {
        answers[q.id] = Math.floor(rng() * (q.options?.length ?? 4));
      }
    }
    return makePlayer(`p-${idx + 1}`, `Player ${idx + 1}`, answers);
  });
}

function assertValidPartition(
  groups: Array<{ playerIds: string[] }>,
  expectedPlayerIds: string[]
): void {
  const seen = new Set<string>();
  for (const g of groups) {
    expect(g.playerIds.length).toBeGreaterThanOrEqual(2);
    expect(g.playerIds.length).toBeLessThanOrEqual(3);
    for (const pid of g.playerIds) {
      expect(seen.has(pid)).toBe(false); // No duplicates
      seen.add(pid);
    }
  }
  expect(seen.size).toBe(expectedPlayerIds.length); // No orphans
  for (const pid of expectedPlayerIds) {
    expect(seen.has(pid)).toBe(true);
  }
}

describe("SparkMatch Matching Algorithm", () => {
  it("computes exact pairwise compatibility for scale and choice questions", () => {
    const miniQuestions: Question[] = [
      {
        id: "s1",
        type: "scale",
        prompt: "Scale Q",
        lowLabel: "Low",
        highLabel: "High",
        topicTag: "Scale",
      },
      {
        id: "c1",
        type: "choice",
        prompt: "Choice Q",
        options: ["A", "B", "C", "D"],
        topicTag: "Choice",
      },
    ];

    const a = makePlayer("a", "A", { s1: 1, c1: 2 });
    const b = makePlayer("b", "B", { s1: 3, c1: 2 }); // scale diff 2 -> 0.5, choice match -> 1.0 => avg 0.75 => 75
    const c = makePlayer("c", "C", { s1: 5, c1: 0 }); // scale diff 4 -> 0.0, choice diff -> 0.0 => 0

    expect(computePairwiseScore(a, b, miniQuestions)).toBe(75);
    expect(computePairwiseScore(a, c, miniQuestions)).toBe(0);
    expect(computePairwiseScore(a, a, miniQuestions)).toBe(100);
  });

  it("applies welfare-adjusted penalty below 40% to protect players from miserable matches", () => {
    expect(welfareWeight(80)).toBe(80);
    expect(welfareWeight(40)).toBe(40);
    expect(welfareWeight(30)).toBe(15); // 30 - 10 * 1.5
    expect(welfareWeight(10)).toBe(-35); // 10 - 30 * 1.5
  });

  it("even players: Bitmask DP beats a crafted greedy trap matrix", () => {
    // Classic 4-player greedy trap:
    // Greedy picks (0, 1) with score 95, leaving (2, 3) with score 10 -> welfare total = 95 + (-35) = 60.
    // Global optimal picks (0, 2) with 85 and (1, 3) with 85 -> welfare total = 170!
    const rawMatrix = [
      [0, 95, 85, 20],
      [95, 0, 20, 85],
      [85, 20, 0, 10],
      [20, 85, 10, 0],
    ];
    const weightMatrix = rawMatrix.map((row) =>
      row.map((score) => (score === 0 ? 0 : welfareWeight(score)))
    );

    const greedyTotal = weightMatrix[0][1] + weightMatrix[2][3];
    const optimalPairs = solveEvenMatchingExact(weightMatrix);
    const optimalTotal = optimalPairs.reduce(
      (sum, [u, v]) => sum + weightMatrix[u][v],
      0
    );

    expect(optimalTotal).toBeGreaterThan(greedyTotal);
    expect(optimalTotal).toBe(170);

    // Verify exact pairs are {0, 2} and {1, 3}
    const normalized = optimalPairs
      .map(([u, v]) => (u < v ? `${u}-${v}` : `${v}-${u}`))
      .sort();
    expect(normalized).toEqual(["0-2", "1-3"]);
  });

  it("handles edge minimums: 2 players (1 pair) and 3 players (1 trio)", () => {
    const twoPlayers = makeRandomPlayers(2, 101);
    const twoMatches = computeRoomMatches(twoPlayers, QUESTIONS);
    expect(twoMatches).toHaveLength(1);
    expect(twoMatches[0].playerIds).toHaveLength(2);
    assertValidPartition(
      twoMatches,
      twoPlayers.map((p) => p.id)
    );
    expect(twoMatches[0].sharedHighlights).toHaveLength(2);
    expect(twoMatches[0].spicyDifference.description.length).toBeGreaterThan(0);

    const threePlayers = makeRandomPlayers(3, 202);
    const threeMatches = computeRoomMatches(threePlayers, QUESTIONS);
    expect(threeMatches).toHaveLength(1);
    expect(threeMatches[0].playerIds).toHaveLength(3);
    assertValidPartition(
      threeMatches,
      threePlayers.map((p) => p.id)
    );
    expect(threeMatches[0].sharedHighlights).toHaveLength(2);
    expect(threeMatches[0].spicyDifference.description.length).toBeGreaterThan(0);
  });

  it("handles odd player counts (5 and 7 players) with exactly 1 trio and zero duplicates/orphans", () => {
    for (const count of [5, 7]) {
      const players = makeRandomPlayers(count, count * 17);
      const matches = computeRoomMatches(players, QUESTIONS);

      const trios = matches.filter((g) => g.playerIds.length === 3);
      const pairs = matches.filter((g) => g.playerIds.length === 2);

      expect(trios).toHaveLength(1);
      expect(pairs).toHaveLength((count - 3) / 2);
      assertValidPartition(
        matches,
        players.map((p) => p.id)
      );

      for (const group of matches) {
        expect(group.compatibility).toBeGreaterThanOrEqual(0);
        expect(group.compatibility).toBeLessThanOrEqual(100);
        expect(group.sharedHighlights).toHaveLength(2);
        expect(group.spicyDifference).toBeDefined();
      }
    }
  });

  it("larger room (20 players): multi-start 2-opt completes quickly and produces valid perfect matching", () => {
    const players = makeRandomPlayers(20, 999);
    const start = performance.now();
    const matches = computeRoomMatches(players, QUESTIONS);
    const elapsedMs = performance.now() - start;

    expect(matches).toHaveLength(10);
    expect(matches.every((g) => g.playerIds.length === 2)).toBe(true);
    assertValidPartition(
      matches,
      players.map((p) => p.id)
    );
    // Should run well under 500ms
    expect(elapsedMs).toBeLessThan(500);

    // Also verify 2-opt finds a strictly better solution than naive sequential pairing on a crafted 20x20 matrix
    const n = 20;
    const weights: number[][] = Array.from({ length: n }, () =>
      Array(n).fill(10)
    );
    for (let i = 0; i < n; i++) weights[i][i] = 0;
    // Plant high-weight planted pairs (i, n - 1 - i)
    for (let i = 0; i < n / 2; i++) {
      const j = n - 1 - i;
      weights[i][j] = 100;
      weights[j][i] = 100;
    }
    const { groups, totalWeight } = solveOptimalMatchingIndices(weights);
    expect(groups).toHaveLength(10);
    expect(totalWeight).toBe(1000);
  });

  it("rarity insights: rare shared answers strictly outrank common room-wide answers", () => {
    // 8-player room:
    // - On q1 (choice): EVERYONE (8/8) picked option 0 -> frequency 1.0 (very common)
    // - On q2 (scale): EVERYONE (8/8) picked 3 -> frequency 1.0 (very common)
    // - On q5 (choice): ONLY Alice & Bob (2/8) picked option 3, everyone else picked 0 -> frequency 0.25 (very rare!)
    // - On q4 (scale): ONLY Alice & Bob (2/8) picked 5, everyone else picked 1 -> frequency 0.25 (very rare!)
    // - On q12 (scale): Alice picked 1, Bob picked 5 -> biggest spicy difference!
    const commonAnswers: Record<string, number> = {
      q1: 0,
      q2: 3,
      q3: 0,
      q4: 1,
      q5: 0,
      q6: 3,
      q7: 3,
      q8: 0,
      q9: 3,
      q10: 0,
      q11: 0,
      q12: 3,
    };

    const alice = makePlayer("alice", "Alice", {
      ...commonAnswers,
      q4: 5,
      q5: 3,
      q12: 1,
    });
    const bob = makePlayer("bob", "Bob", {
      ...commonAnswers,
      q4: 5,
      q5: 3,
      q12: 5,
    });
    const others = Array.from({ length: 6 }, (_, i) =>
      makePlayer(`other-${i}`, `Other ${i}`, { ...commonAnswers })
    );

    const allRoomPlayers = [alice, bob, ...others];
    const { sharedHighlights, spicyDifference } = computeGroupInsights(
      [alice, bob],
      allRoomPlayers,
      QUESTIONS
    );

    expect(sharedHighlights).toHaveLength(2);
    const highlightIds = sharedHighlights.map((h) => h.questionId);
    expect(highlightIds).toContain("q5");
    expect(highlightIds).toContain("q4");
    expect(highlightIds).not.toContain("q1");
    expect(highlightIds).not.toContain("q2");

    // Choice rare match (q5) gets the exact-choice bonus over scale rare match (q4) of equal frequency
    expect(sharedHighlights[0].questionId).toBe("q5");
    expect(sharedHighlights[1].questionId).toBe("q4");
    expect(sharedHighlights[0].rarityScore).toBeGreaterThan(0.7);
    expect(sharedHighlights[1].rarityScore).toBeGreaterThan(0.7);

    // Biggest disagreement should be q12 (1 vs 5)
    expect(spicyDifference.questionId).toBe("q12");
    expect(spicyDifference.description).toContain("Alice");
    expect(spicyDifference.description).toContain("Bob");
  });

  it("worst enemy: picks the least similar non-partner in the room for each player", () => {
    const lowAnswers: Record<string, number> = {
      q1: 0,
      q2: 1,
      q3: 0,
      q4: 1,
      q5: 0,
      q6: 1,
      q7: 1,
      q8: 0,
      q9: 1,
      q10: 0,
      q11: 0,
      q12: 1,
    };
    const highAnswers: Record<string, number> = {
      q1: 3,
      q2: 5,
      q3: 3,
      q4: 5,
      q5: 3,
      q6: 5,
      q7: 5,
      q8: 3,
      q9: 5,
      q10: 3,
      q11: 3,
      q12: 5,
    };
    const midAnswers: Record<string, number> = {
      q1: 1,
      q2: 3,
      q3: 1,
      q4: 3,
      q5: 1,
      q6: 3,
      q7: 3,
      q8: 1,
      q9: 3,
      q10: 1,
      q11: 1,
      q12: 3,
    };

    const alice = makePlayer("alice", "Alice", lowAnswers);
    const bob = makePlayer("bob", "Bob", { ...lowAnswers, q2: 2 }); // super similar to Alice
    const zelda = makePlayer("zelda", "Zelda", highAnswers); // 0% compatible with Alice!
    const carl = makePlayer("carl", "Carl", midAnswers);

    const players = [alice, bob, zelda, carl];
    const matches = computeRoomMatches(players, QUESTIONS);
    const enemies = computeWorstEnemies(players, QUESTIONS, matches);

    expect(enemies.size).toBe(4);
    // Alice's worst enemy must be Zelda (0% compatibility)
    const aliceEnemy = enemies.get("alice");
    expect(aliceEnemy?.enemyId).toBe("zelda");
    expect(aliceEnemy?.compatibility).toBe(0);
    expect(aliceEnemy?.biggestClash.description).toContain("Alice");
    expect(aliceEnemy?.biggestClash.description).toContain("Zelda");

    // Zelda's worst enemy must be Alice (0% compatibility)
    const zeldaEnemy = enemies.get("zelda");
    expect(zeldaEnemy?.enemyId).toBe("alice");
    expect(zeldaEnemy?.compatibility).toBe(0);

    // Nobody is ever their own worst enemy or paired with their own SparkMatch partner in a 4-player room
    for (const group of matches) {
      for (const pid of group.playerIds) {
        const enemyId = enemies.get(pid)?.enemyId;
        expect(enemyId).toBeDefined();
        expect(enemyId).not.toBe(pid);
        expect(group.playerIds).not.toContain(enemyId);
      }
    }
  });
});
