/**
 * index.ts — Express application entry point
 *
 * Mounts all route modules, sets up CORS for the Vite dev server,
 * and starts listening on the configured port.
 */

import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";

import { authenticate } from "./middleware/auth";
import { sseHandler, getPresence } from "./events";
import prisma from "./db/prisma";
import authRoutes from "./routes/auth";
import usersRoutes from "./routes/users";
import categoriesRoutes from "./routes/categories";
import menuRoutes from "./routes/menu";
import tablesRoutes from "./routes/tables";
import ordersRoutes from "./routes/orders";
import settingsRoutes from "./routes/settings";

const app = express();
const PORT = Number(process.env.PORT ?? 3001);

// ─── CORS — needed for local dev (Vite :5173 → Express :3001) ───
// In production (single Vercel project) both share the same origin,
// so these headers are harmless no-ops.
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");

  // Handle preflight
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  next();
});

app.use(express.json());
app.use(cookieParser());
app.use(authenticate);        // decode JWT on every request (non-blocking)

// ─── Routes ──────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/tables", tablesRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/settings", settingsRoutes);
app.get("/api/events", sseHandler);      // SSE real-time stream

// Presence polling endpoint (Vercel optimization: fallback if SSE drops)
// Uses same DB-backed merge as /api/tables/presence
app.get("/api/events/presence", async (_req, res) => {
  const memoryPresence = getPresence();
  try {
    const cutoff = new Date(Date.now() - 2 * 60 * 1000);
    const activeRows = await prisma.customerPresence.groupBy({
      by: ["tableId"],
      where: { lastHeartbeatAt: { gte: cutoff } },
      _count: { id: true },
    });
    const merged: Record<number, number> = { ...memoryPresence };
    for (const row of activeRows) {
      const dbCount = row._count.id;
      merged[row.tableId] = Math.max(merged[row.tableId] ?? 0, dbCount);
    }
    res.json({ presence: merged });
  } catch {
    res.json({ presence: memoryPresence });
  }
});

// ─── Health check ────────────────────────────────────────────
app.get("/api/health", async (_req, res) => {
  const checks: Record<string, string> = {
    status: "ok",
    timestamp: new Date().toISOString(),
    database_url: process.env.DATABASE_URL ? "set" : "MISSING",
    jwt_secret: process.env.JWT_SECRET ? "set" : "MISSING",
    vercel: process.env.VERCEL ? "true" : "false",
  };

  // Test DB connection
  try {
    const result = await prisma.$queryRaw`SELECT 1 as ok`;
    checks.database = "connected";
  } catch (err: any) {
    checks.database = `error: ${err.message}`;
    checks.status = "degraded";
  }

  const statusCode = checks.status === "ok" ? 200 : 503;
  res.status(statusCode).json(checks);
});

// ─── Start (skip in serverless environments like Vercel) ─────
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🍣 Sushi Dash API running on http://localhost:${PORT}`);
  });
}

export default app;
