/**
 * Vercel Serverless Function entry point.
 * Re-exports the Express app so Vercel can handle it as a serverless function.
 */
import app from "../src/index.js";

export default app;
