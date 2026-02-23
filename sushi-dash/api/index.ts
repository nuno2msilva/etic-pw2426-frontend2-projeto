// Vercel serverless function — re-exports the Express app as a serverless handler
// Environment variables (DATABASE_URL, JWT_SECRET) must be set in Vercel project settings
import app from "../server/src/index.js";

export default app;

export const config = {
  maxDuration: 10,
};
