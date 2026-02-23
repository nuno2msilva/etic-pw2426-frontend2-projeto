/**
 * Catch-all Next.js API route — delegates every /api/* request to the Express app.
 *
 * Why Pages Router instead of App Router?
 *   Pages Router API routes give us Node.js IncomingMessage / ServerResponse,
 *   which Express can handle directly — zero adapter code needed.
 *
 * In development the next.config.ts rewrite proxies to the standalone Express
 * server on :3001 so this handler is never reached. On Vercel (production) no
 * rewrite exists, so Next.js matches here and Express takes over.
 */

import type { NextApiRequest, NextApiResponse } from "next";
import app from "../../server/src/index";

export const config = {
  api: {
    bodyParser: false,       // Let Express parse bodies itself
    externalResolver: true,  // Suppress "API resolved without sending a response" warning
  },
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Express handles the full request lifecycle
  return app(req as any, res as any);
}
