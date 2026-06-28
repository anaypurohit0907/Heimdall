import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const [matches, candidates] = await Promise.all([
    prisma.tournamentMatch.findMany({
      orderBy: [{ round: "asc" }, { createdAt: "asc" }],
      take: 100,
      select: {
        id: true,
        status: true,
        matchType: true,
        round: true,
        podCandidates: true,
        rankings: true,
        createdAt: true,
      },
    }),
    prisma.candidate.findMany({
      orderBy: { eloScore: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        eloScore: true,
        structuredData: true,
      },
    }),
  ]);

  return NextResponse.json({ matches, leaderboard: candidates });
}
