/**
 * db/prisma.ts — Prisma client singleton
 *
 * Creates a single PrismaClient instance shared across the entire server.
 * All database access should import `prisma` from this module.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
});

export default prisma;
