import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    inlineCss: true,
    optimizeCss: true,
    optimizePackageImports: ["lucide-react", "sonner"],
  },

  // Turbopack is the default and only bundler in Next.js 16+
  // No webpack fallback - ensures modern ES output without polyfills
  turbopack: {
    resolveAlias: {
      "@": "./src",
    },
  },

  // Dev: proxy /api/* to the standalone Express server on :3001
  // Production (Vercel): pages/api/[...path].ts handles /api/* natively
  async rewrites() {
    if (process.env.NODE_ENV === "production") return [];
    return [
      {
        source: "/api/:path((?!v1/).*)",
        destination: "http://localhost:3001/api/:path*",
      },
    ];
  },
};

export default nextConfig;
