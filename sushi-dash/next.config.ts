import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    inlineCss: true,
    optimizeCss: true,
    browsersListForSwc: true,
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

  // Turbopack is the default and only bundler in Next.js 16+
  // No webpack fallback - ensures modern ES output without polyfills
  turbopack: {
    resolveAlias: {
      "@": "./src",
      // Skip Next.js's unconditional polyfill bundle — our browserslist targets
      // Chrome 105+, Safari 15.4+, Firefox 104+, Edge 105+ which natively support
      // all of: Array.at, Array.flat/flatMap, Object.fromEntries, Object.hasOwn,
      // String.trimStart/trimEnd. The 13.7 KiB chunk is pure dead weight.
      "next/dist/build/polyfills/polyfill-module.js": "./src/lib/noop.ts",
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
