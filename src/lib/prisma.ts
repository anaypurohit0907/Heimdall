import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const SUPABASE_POOLER = {
  host: "aws-1-ap-northeast-1.pooler.supabase.com",
  port: 5432,
  database: "postgres",
  user: "postgres.tahyzxqfbinemedpabsn",
  password: process.env.SUPABASE_DB_PASSWORD!,
  ssl: { rejectUnauthorized: false },
};

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const createPrismaClient = () => {
  const pool = new Pool(SUPABASE_POOLER);
  return new PrismaClient({ adapter: new PrismaPg(pool) });
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
