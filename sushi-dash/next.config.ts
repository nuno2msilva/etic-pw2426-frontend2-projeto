import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Don't bundle server-side packages — let Node.js resolve them at runtime
  serverExternalPackages: [
    "@prisma/client",
    "@prisma/adapter-pg",
    "express",
    "cookie-parser",
    "jsonwebtoken",
    "dotenv",
  ],

  // Resolve .js imports to .ts files (server code uses ESM .js extensions)
  webpack(config) {
    config.resolve.extensionAlias = {
      ".js": [".ts", ".tsx", ".js", ".jsx"],
    };
    return config;
  },

  // Dev: proxy API requests to local Express server
  // On Vercel: app/api/[...path]/route.ts handles /api/* via the Express app directly
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
