import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Optional proxy if external backend URL is explicitly configured
  async rewrites() {
    const rawUrl =
      process.env.BACKEND_INTERNAL_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "";

    const cleanBackendUrl = rawUrl.trim().replace(/\/+$/, "").replace(/\/api\/v1\/?$/, "");

    if (!cleanBackendUrl) {
      return [];
    }

    return [
      {
        source: "/api/v1/:path*",
        destination: `${cleanBackendUrl}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
