import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updatePodElo } from "@/lib/tournament";
import { evaluatePod } from "@/lib/gemini";
import { tournamentEvents } from "@/lib/events";

const BATCH_SIZE = 2;
const BATCH_DELAY_MS = 14_000;
const POD_SIZE = 4;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Cand = { id: string; name: string; rawText: string; eloScore: number };
type Ranking = { candidateId: string; rank: number; justification: string };

// ── Precompute bracket tree ──
function computeBracket(n: number): number[][] {
  const tree: number[][] = [];
  let cur = n;
  while (cur > 0) {
    const pods = Math.ceil(cur / POD_SIZE);
    tree.push(Array.from({ length: pods }, (_, i) => i));
    cur = pods;
    if (pods <= 1) break;
  }
  return tree;
}

// ── Gemini call with retry ──
async function evaluate(candidates: Cand[], jdText: string, maxRetries = 5) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await evaluatePod(jdText, candidates);
    } catch (e) {
      const err = e as Error & { status?: number };
      if ((err.status === 429 || err.status === 503) && attempt < maxRetries) {
        const wait = BATCH_DELAY_MS * attempt * 1.5;
        console.log(`Retry ${attempt}/${maxRetries} in ${Math.round(wait)}ms (${err.status})`);
        await sleep(wait);
        continue;
      }
      throw e;
    }
  }
  throw new Error("Max retries");
}

// ── Process a single pod ──
async function processPod(
  matchId: string,
  candidates: Cand[],
  jdText: string,
) {
  const match = await prisma.tournamentMatch.findUniqueOrThrow({ where: { id: matchId } });
  const podIds = match.podCandidates as string[];
  if (podIds.length === 0) return null;

  const pod = podIds
    .map((id) => candidates.find((c) => c.id === id))
    .filter(Boolean) as Cand[];

  await prisma.tournamentMatch.update({
    where: { id: matchId },
    data: { status: "processing" },
  });

  const result = await evaluate(pod, jdText);

  const rankings = result.rankings.map((r) => ({
    candidateId: r.candidate_id,
    rank: r.rank,
    justification: r.justification,
  }));

  const eloUpdates = updatePodElo(pod, rankings);

  for (const u of eloUpdates) {
    await prisma.candidate.update({
      where: { id: u.candidateId },
      data: { eloScore: u.newElo },
    });
  }

  await prisma.tournamentMatch.update({
    where: { id: matchId },
    data: {
      status: "completed",
      rankings,
      reasoningTrace: result.reasoning_trace,
    },
  });

  return { rankings, eloUpdates, reasoningTrace: result.reasoning_trace };
}

// ── Run a batch of pods ──
async function runBatch(
  matchIds: string[],
  candidates: Cand[],
  jdText: string,
  round: number,
) {
  const results = await Promise.allSettled(
    matchIds.map(async (id) => {
      try {
        const r = await processPod(id, candidates, jdText);
        if (r) {
          tournamentEvents.emit("match_done", {
            type: "match_done",
            matchId: id,
            data: { round, rankings: r.rankings, eloUpdates: r.eloUpdates, reasoningTrace: r.reasoningTrace },
          });
        }
      } catch (error) {
        const err = error as Error;
        console.error(`Pod ${id} R${round}: ${err.message.slice(0, 100)}`);
        try {
          await prisma.tournamentMatch.update({
            where: { id },
            data: { status: "failed" },
          });
        } catch { /* ignore */ }
        tournamentEvents.emit("match_done", {
          type: "match_done",
          matchId: id,
          data: { round, error: true },
        });
      }
    }),
  );
  return results;
}

// ── Process entire round ──
async function runRound(
  round: number,
  matchIds: string[],
  candidates: Cand[],
  jdText: string,
) {
  for (let i = 0; i < matchIds.length; i += BATCH_SIZE) {
    const batch = matchIds.slice(i, i + BATCH_SIZE);
    await runBatch(batch, candidates, jdText, round);
    if (i + BATCH_SIZE < matchIds.length) await sleep(BATCH_DELAY_MS);
  }
}

// ── Main tournament runner ──
async function runTournament(
  jd: { id: string; rawText: string },
  allCandidates: Cand[],
  allMatches: { id: string; round: number }[],
  bracket: number[][],
) {
  for (let r = 0; r < bracket.length; r++) {
    const round = r + 1;
    const roundMatchIds = allMatches.filter((m) => m.round === round).map((m) => m.id);

    tournamentEvents.emit("round_start", {
      type: "round_start",
      data: { round, podCount: bracket[r].length },
    });

    await runRound(round, roundMatchIds, allCandidates, jd.rawText);

    tournamentEvents.emit("round_end", {
      type: "round_end",
      data: { round },
    });

    // Feed winners to next round
    if (r < bracket.length - 1) {
      const completed = await prisma.tournamentMatch.findMany({
        where: { id: { in: roundMatchIds }, status: "completed" },
        orderBy: { id: "asc" },
        select: { rankings: true },
      });

      const winners: string[] = [];
      for (const m of completed) {
        const rk = (m.rankings || []) as Ranking[];
        const w = rk.find((x) => x.rank === 1);
        if (w) winners.push(w.candidateId);
      }

      const nextIds = allMatches
        .filter((m) => m.round === round + 1)
        .sort((a, b) => a.id.localeCompare(b.id));

      for (let i = 0; i < nextIds.length; i++) {
        const group = winners.slice(i * POD_SIZE, (i + 1) * POD_SIZE);
        if (group.length > 0) {
          await prisma.tournamentMatch.update({
            where: { id: nextIds[i].id },
            data: { podCandidates: group, status: "pending" },
          });
        }
      }

      // Refresh candidates with updated Elo
      const fresh = await prisma.candidate.findMany({
        select: { id: true, name: true, rawText: true, eloScore: true },
      });
      allCandidates.length = 0;
      allCandidates.push(...fresh);
    }
  }

  tournamentEvents.emit("tournament_end", {
    type: "tournament_end",
  });
}

// ── POST handler ──
export async function POST(request: NextRequest) {
  try {
    const { jdId } = await request.json();
    const jd = await prisma.jobDescription.findUnique({ where: { id: jdId } });
    if (!jd) return NextResponse.json({ error: "JD not found" }, { status: 404 });

    const allCandidates = await prisma.candidate.findMany({
      select: { id: true, name: true, rawText: true, eloScore: true },
    });
    if (allCandidates.length < 2) {
      return NextResponse.json({ error: "Need 2+ candidates" }, { status: 400 });
    }

    await prisma.tournamentMatch.deleteMany();

    const bracket = computeBracket(allCandidates.length);
    const allMatches: { id: string; round: number }[] = [];

    for (let r = 0; r < bracket.length; r++) {
      for (let pi = 0; pi < bracket[r].length; pi++) {
        let podCandidates: string[] = [];
        if (r === 0) {
          const start = pi * POD_SIZE;
          podCandidates = allCandidates.slice(start, start + POD_SIZE).map((c) => c.id);
        }
        const match = await prisma.tournamentMatch.create({
          data: {
            matchType: "pod",
            round: r + 1,
            status: r === 0 ? "pending" : "waiting",
            podCandidates,
            jobDescriptionId: jd.id,
          },
        });
        allMatches.push({ id: match.id, round: r + 1 });
      }
    }

    // Async fire-and-forget
    runTournament(jd, allCandidates, allMatches, bracket).catch(console.error);

    return NextResponse.json({
      bracket,
      totalPods: bracket.reduce((s, r) => s + r.length, 0),
      totalRounds: bracket.length,
    });
  } catch (error) {
    console.error("Start error:", error);
    return NextResponse.json({ error: "Start failed" }, { status: 500 });
  }
}
