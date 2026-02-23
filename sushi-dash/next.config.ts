import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dev: proxy /api/* to the standalone Express server on :3001
  // Production (Vercel): pages/api/[...path].ts handles /api/* natively
  async rewrites() {
    if (process.env.NODE_ENV === "production") return [];
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:3001/api/:path*",
      },
    ];
  },

  // Allow .js imports to resolve to .ts files (server code uses ESM convention)
  webpack: (config) => {
    config.resolve.extensionAlias = {
      ".js": [".ts", ".tsx", ".js", ".jsx"],
    };
    return config;
  },
};

export default nextConfig;
