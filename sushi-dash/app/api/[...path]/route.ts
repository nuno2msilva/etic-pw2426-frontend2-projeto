/**
 * Next.js App Router catch-all API route
 *
 * Bridges Next.js Web API (Request/Response) to the Express app.
 * All /api/* requests are forwarded to the Express server handler.
 */

import { NextRequest, NextResponse } from "next/server";
import { Readable } from "stream";

// Force dynamic — no caching for API routes
export const dynamic = "force-dynamic";

// Dynamically import the Express app (lazy singleton)
let appPromise: Promise<any> | null = null;

function getApp() {
  if (!appPromise) {
    appPromise = import("../../../server/src/index").then((m) => m.default);
  }
  return appPromise;
}

/** Convert Web API Request → Express-compatible handler → Web API Response */
async function handler(request: NextRequest): Promise<Response> {
  let app: any;
  try {
    app = await getApp();
  } catch (err: any) {
    console.error("Failed to load Express app:", err);
    return NextResponse.json(
      { error: "Server initialization failed", message: err.message },
      { status: 500 }
    );
  }

  const url = new URL(request.url);

  // Read body upfront (for POST/PUT/PATCH)
  let bodyBuf: Buffer | null = null;
  if (request.body) {
    bodyBuf = Buffer.from(await request.arrayBuffer());
  }

  // Build plain headers object
  const headers: Record<string, string> = {};
  request.headers.forEach((v, k) => {
    headers[k] = v;
  });

  return new Promise<Response>((resolve) => {
    // Build Node.js-style IncomingMessage mock
    const req: any = new Readable({ read() {} });
    req.method = request.method;
    req.url = url.pathname + url.search;
    req.headers = headers;
    req.connection = {
      encrypted: url.protocol === "https:",
      remoteAddress: "127.0.0.1",
    };
    req.socket = { remoteAddress: "127.0.0.1" };

    if (bodyBuf && bodyBuf.length > 0) {
      req.push(bodyBuf);
    }
    req.push(null);

    // Build Node.js-style ServerResponse mock
    const chunks: Buffer[] = [];
    let statusCode = 200;
    const resHeaders: Record<string, string | string[]> = {};
    let resolved = false;

    function finish() {
      if (resolved) return;
      resolved = true;

      const responseHeaders = new Headers();
      for (const [k, v] of Object.entries(resHeaders)) {
        if (Array.isArray(v))
          v.forEach((val) => responseHeaders.append(k, val));
        else responseHeaders.set(k, String(v));
      }

      resolve(
        new Response(Buffer.concat(chunks), {
          status: statusCode,
          headers: responseHeaders,
        })
      );
    }

    const res: any = {
      statusCode: 200,
      headersSent: false,

      setHeader(name: string, value: string | string[]) {
        resHeaders[name.toLowerCase()] = value;
        return res;
      },
      getHeader(name: string) {
        return resHeaders[name.toLowerCase()];
      },
      removeHeader(name: string) {
        delete resHeaders[name.toLowerCase()];
      },
      writeHead(
        code: number,
        reasonOrHeaders?: any,
        maybeHeaders?: any
      ) {
        statusCode = code;
        res.statusCode = code;
        const h =
          typeof reasonOrHeaders === "object"
            ? reasonOrHeaders
            : maybeHeaders;
        if (h) {
          for (const [k, v] of Object.entries(h)) {
            resHeaders[k.toLowerCase()] = v as string;
          }
        }
        return res;
      },

      write(chunk: any, encodingOrCb?: any, cb?: any) {
        const callback =
          typeof encodingOrCb === "function" ? encodingOrCb : cb;
        chunks.push(
          Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk))
        );
        if (callback) callback();
        return true;
      },

      end(chunk?: any, encoding?: any, cb?: any) {
        if (typeof chunk === "function") {
          cb = chunk;
          chunk = null;
        }
        if (typeof encoding === "function") {
          cb = encoding;
          encoding = null;
        }
        if (chunk)
          chunks.push(
            Buffer.isBuffer(chunk)
              ? chunk
              : Buffer.from(String(chunk))
          );

        finish();
        if (cb) cb();
      },

      // Express uses these internally
      on() {
        return res;
      },
      once() {
        return res;
      },
      emit() {
        return res;
      },
    };

    // Dispatch to Express
    try {
      app(req, res);
    } catch (err: any) {
      console.error("Express dispatch error:", err);
      if (!resolved) {
        resolve(
          NextResponse.json(
            { error: "Server error", message: err.message },
            { status: 500 }
          )
        );
      }
    }
  });
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const OPTIONS = handler;
