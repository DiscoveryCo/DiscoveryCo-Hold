import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["app.discoveryco.me"],
  async headers() {
    return [
      {
        source: "/billing",
        headers: [{ key: "Cache-Control", value: "no-store" }],
      },
    ]
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
};

export default nextConfig;
