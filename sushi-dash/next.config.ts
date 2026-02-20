import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Proxy API requests to the Express backend in local dev only
  // On Vercel, vercel.json rewrites handle routing to the serverless function
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
