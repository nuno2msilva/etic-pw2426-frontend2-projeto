/**
 * Vercel Serverless Function entry point.
 * Re-exports the Express app so Vercel can handle it as a serverless function.
 * All /api/* requests are routed here via vercel.json rewrites.
 */
import app from "../server/src/index.js";

export default app;
