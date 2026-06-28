const K_FACTOR = 32;

export function calculateElo(
  ratingA: number,
  ratingB: number,
  scoreA: number, // 1 = win, 0 = loss, 0.5 = draw
): { newRatingA: number; newRatingB: number } {
  const expectedA = 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
  const expectedB = 1 - expectedA;

  const newRatingA = Math.round(ratingA + K_FACTOR * (scoreA - expectedA));
  const newRatingB = Math.round(ratingB + K_FACTOR * (1 - scoreA - expectedB));

  return { newRatingA, newRatingB };
}

type RankedCandidate = {
  candidateId: string;
  rank: number; // 1 = best
};

export function updatePodElo(
  candidates: { id: string; eloScore: number }[],
  rankings: RankedCandidate[],
): { candidateId: string; oldElo: number; newElo: number; delta: number }[] {
  const results: { candidateId: string; oldElo: number; newElo: number; delta: number }[] = [];

  for (let i = 0; i < rankings.length; i++) {
    const ranked = rankings[i];
    const candidate = candidates.find((c) => c.id === ranked.candidateId);
    if (!candidate) continue;

    const oldElo = candidate.eloScore;
    let newElo = oldElo;

    for (let j = 0; j < rankings.length; j++) {
      if (i === j) continue;

      const opponent = candidates.find((c) => c.id === rankings[j].candidateId);
      if (!opponent) continue;

      const score = i < j ? 1 : 0;
      const { newRatingA } = calculateElo(
        newElo,
        opponent.eloScore,
        score,
      );
      newElo = newRatingA;
    }

    results.push({
      candidateId: ranked.candidateId,
      oldElo,
      newElo: Math.round(newElo),
      delta: Math.round(newElo - oldElo),
    });
  }

  return results;
}

export function generatePods(
  candidateIds: string[],
  podSize: number = 4,
): string[][] {
  const shuffled = [...candidateIds].sort(() => Math.random() - 0.5);
  const pods: string[][] = [];

  for (let i = 0; i < shuffled.length; i += podSize) {
    const pod = shuffled.slice(i, i + podSize);
    if (pod.length >= 2) {
      pods.push(pod);
    } else if (pods.length > 0) {
      pods[pods.length - 1].push(...pod);
    }
  }

  return pods;
}
