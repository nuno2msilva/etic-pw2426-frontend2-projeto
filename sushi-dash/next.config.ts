import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // API requests proxy to the Express backend in development
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:3001/api/:path*",
      },
    ];
  },
};

export default nextConfig;
