/**
 * index.ts — Express application entry point
 *
 * Mounts all route modules, sets up CORS for the Vite dev server,
 * and starts listening on the configured port.
 */

import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";

import { authenticate } from "./middleware/auth.js";
import { sseHandler } from "./events.js";
import authRoutes from "./routes/auth.js";
import categoriesRoutes from "./routes/categories.js";
import menuRoutes from "./routes/menu.js";
import tablesRoutes from "./routes/tables.js";
import ordersRoutes from "./routes/orders.js";
import settingsRoutes from "./routes/settings.js";

const app = express();
const PORT = Number(process.env.PORT ?? 3001);

// ─── CORS — manual middleware (works reliably in Vercel serverless) ───
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
app.use("/api/categories", categoriesRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/tables", tablesRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/settings", settingsRoutes);
app.get("/api/events", sseHandler);      // SSE real-time stream

// ─── Health check ────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ─── Start (skip in serverless environments like Vercel) ─────
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🍣 Sushi Dash API running on http://localhost:${PORT}`);
  });
}

export default app;
