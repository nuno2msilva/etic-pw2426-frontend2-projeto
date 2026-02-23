// Prisma client singleton — all database access imports from here

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

if (!process.env.DATABASE_URL) {
  console.error("FATAL: DATABASE_URL environment variable is not set");
}

let prisma: PrismaClient;

try {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  prisma = new PrismaClient({ adapter });
} catch (err) {
  console.error("Failed to initialize Prisma client:", err);
  // Create a dummy client that will fail on first query with a clear message
  prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: "postgresql://invalid:invalid@localhost:5432/invalid" }) });
}

export default prisma;
