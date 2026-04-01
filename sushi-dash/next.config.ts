import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    inlineCss: true,
    optimizePackageImports: [
      "lucide-react",
      "sonner",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-tabs",
      "@radix-ui/react-tooltip",
      "@radix-ui/react-collapsible",
      "@radix-ui/react-select",
      "@tanstack/react-query",
    ],
  },

  // Turbopack (dev + production — Next.js 16 uses Turbopack by default).
  // Note: resolveAlias only intercepts module-specifier imports, not relative imports
  // inside Next.js's own source. The polyfill-module is imported relatively from
  // next/dist/client/app-globals.js so it cannot be aliased out this way.
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
