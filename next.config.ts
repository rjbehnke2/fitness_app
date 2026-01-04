import type { NextConfig } from "next";
import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,

  // Empty turbopack config to silence webpack/turbopack conflict warning
  turbopack: {},

  // Image optimization configuration
  images: {
    domains: [],
  },

  // Environment variables that should be available on the client
  env: {
    NEXT_PUBLIC_APP_NAME: "FitCoach",
  },
};

export default withPWA(nextConfig);
