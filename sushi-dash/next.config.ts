import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dev: proxy API requests to local Express server
  // Vercel: the api/index.ts serverless function handles /api/* natively
  async rewrites() {
    if (process.env.VERCEL) return [];
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:3001/api/:path*",
      },
    ];
  },
};

export default nextConfig;
