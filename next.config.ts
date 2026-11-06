import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Allow the preview gateway to serve Next.js assets cross-origin
  allowedDevOrigins: ["*.space-z.ai", "localhost:81"],
};

export default nextConfig;
