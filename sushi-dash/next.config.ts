import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ["lucide-react", "sonner"],
  },

  // Configure webpack to target ES2020+ and eliminate polyfills
  // Mobile Lighthouse requires this to avoid 12 KiB of polyfill overhead
  webpack: (config, { isServer }) => {
    // Allow .js imports to resolve to .ts files (server code uses ESM convention)
    config.resolve.extensionAlias = {
      ".js": [".ts", ".tsx", ".js", ".jsx"],
    };

    // Set modern output targets via webpack output environment
    // This prevents SWC from transpiling to older targets and adding polyfills
    config.output.environment = {
      arrowFunction: true,
      asyncFunction: true,
      bigIntLiteral: true,
      const: true,
      destructuring: true,
      dynamicImport: true,
      forOf: true,
      module: true,
      optionalChaining: true,
      templateLiteral: true,
    };

      // Optimize chunk splitting to isolate React Query into lazy-loaded chunk
      // This prevents React Query from bloating the landing page bundle
      if (!isServer) {
        config.optimization.splitChunks = {
          ...config.optimization.splitChunks,
          cacheGroups: {
            ...config.optimization.splitChunks?.cacheGroups,
            // Isolate React Query into a separate chunk loaded only when needed
            reactQuery: {
              test: /[\\/]node_modules[\\/](@tanstack[\\/]react-query)[\\/]/,
              name: "react-query",
              priority: 10,
              reuseExistingChunk: true,
              enforce: true,
            },
          },
        };
      }

    return config;
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
