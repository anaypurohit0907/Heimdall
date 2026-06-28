import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as fs from "fs";

const pool = new Pool({
  host: "aws-1-ap-northeast-1.pooler.supabase.com",
  port: 5432,
  database: "postgres",
  user: "postgres.tahyzxqfbinemedpabsn",
  password: process.env.SUPABASE_DB_PASSWORD!,
  ssl: { rejectUnauthorized: false },
});
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  const jdText = fs.readFileSync("/tmp/heimdall_jd.txt", "utf-8").trim();
  const candidates = JSON.parse(fs.readFileSync("/tmp/heimdall_candidates.json", "utf-8"));

  console.log("  Clearing existing data...");
  await prisma.tournamentMatch.deleteMany();
  await prisma.candidate.deleteMany();
  await prisma.jobDescription.deleteMany();

  console.log("  Creating JD...");
  const jd = await prisma.jobDescription.create({
    data: {
      title: "Senior AI Engineer — Founding Team (Redrob AI)",
      rawText: jdText,
      structuredData: {
        requiredSkills: ["embeddings-based retrieval","vector databases","Python","ranking evaluation","LLM","production ML"],
        industry: "AI/Talent Intelligence",
        location: "Pune/Noida, India",
        experienceRange: "5-9 years",
      },
      isActive: true,
    },
  });
  console.log("  JD created:", jd.id);

  console.log("  Inserting", candidates.length, "candidates...");
  for (const c of candidates) {
    await prisma.candidate.create({ data: c });
    process.stdout.write(".");
  }
  console.log();

  const count = await prisma.candidate.count();
  console.log("  Done!", count, "candidates in database.");
  console.log("");
  console.log("  Run: npm run dev → http://localhost:3000 → click Start Tournament");
}

main().catch(e => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); await pool.end(); });
