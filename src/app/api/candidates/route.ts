import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const candidates = await prisma.candidate.findMany({
    orderBy: { eloScore: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      eloScore: true,
      structuredData: true,
    },
  });
  return NextResponse.json(candidates);
}
