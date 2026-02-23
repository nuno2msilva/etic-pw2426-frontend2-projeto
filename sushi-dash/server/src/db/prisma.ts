// Prisma client singleton — all database access imports from here

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

let prisma: PrismaClient;

function getClient(): PrismaClient {
  if (!prisma) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is not set");
    }
    const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
    prisma = new PrismaClient({ adapter });
  }
  return prisma;
}

// Default export is a proxy that lazily initialises on first property access
export default new Proxy({} as PrismaClient, {
  get(_target, prop) {
    return (getClient() as any)[prop];
  },
});
