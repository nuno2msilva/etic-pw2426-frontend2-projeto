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

  // Proxy Umami analytics through our own domain to bypass ad blockers.
  // Script: /stats/script.js → cloud.umami.is/script.js
  // API:    /stats/api/send  → api-gateway.umami.dev/api/send
  async rewrites() {
    const umamiProxy = [
      {
        source: "/stats/script.js",
        destination: "https://cloud.umami.is/script.js",
      },
      {
        source: "/stats/api/send",
        destination: "https://api-gateway.umami.dev/api/send",
      },
    ];

    if (process.env.NODE_ENV === "production") return umamiProxy;
    return [
      ...umamiProxy,
      {
        source: "/api/:path((?!v1/).*)",
        destination: "http://localhost:3001/api/:path*",
      },
    ];
  },
};

export default nextConfig;
