/**
 * db/prisma.ts — Prisma client singleton
 *
 * Creates a single PrismaClient instance shared across the entire server.
 * All database access should import `prisma` from this module.
 *
 * Prisma 7 requires a driver adapter for direct PostgreSQL connections.
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export default prisma;
