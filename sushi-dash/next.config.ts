import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dev: proxy to local Express server
  // Vercel: rewrite to the serverless function at /api (api/index.ts)
  async rewrites() {
    if (process.env.VERCEL) {
      return [
        {
          source: "/api/:path*",
          destination: "/api",
        },
      ];
    }
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:3001/api/:path*",
      },
    ];
  },
};

export default nextConfig;
