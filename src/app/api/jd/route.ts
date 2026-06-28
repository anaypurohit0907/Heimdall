import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const jd = await prisma.jobDescription.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
  });
  if (!jd) return NextResponse.json({ error: "No active JD" }, { status: 404 });
  return NextResponse.json(jd);
}
