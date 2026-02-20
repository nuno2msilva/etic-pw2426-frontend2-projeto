// Vercel serverless function — re-exports the Express app as a serverless handler
import app from "../server/src/index.js";

export default app;
