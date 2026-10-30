import type { NextConfig } from "next";
import { loadEnvConfig } from "@next/env";

// Ensure .env / .env.local are loaded before middleware/proxy bundles read Clerk keys
loadEnvConfig(process.cwd());

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "",
    CLERK_PUBLISHABLE_KEY: process.env.CLERK_PUBLISHABLE_KEY ?? "",
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY ?? "",
    CLERK_ENCRYPTION_KEY: process.env.CLERK_ENCRYPTION_KEY ?? "",
  },
  cacheComponents: false,
  partialPrefetching: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
