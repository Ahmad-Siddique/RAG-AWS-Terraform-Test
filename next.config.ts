import type { NextConfig } from "next";
import { loadEnvConfig } from "@next/env";

// Load .env / .env.local before reading Clerk keys (local dev).
loadEnvConfig(process.cwd());

// Vercel often provides CLERK_PUBLISHABLE_KEY only; Next client needs NEXT_PUBLIC_*.
if (
  !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim() &&
  process.env.CLERK_PUBLISHABLE_KEY?.trim()
) {
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY =
    process.env.CLERK_PUBLISHABLE_KEY.trim();
}

function pickEnv(keys: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of keys) {
    const value = process.env[key]?.trim();
    if (value) {
      out[key] = value;
    }
  }
  return out;
}

const nextConfig: NextConfig = {
  // Only inline defined values — never set NEXT_PUBLIC_* to "" (breaks Vercel builds).
  env: pickEnv([
    "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
    "CLERK_PUBLISHABLE_KEY",
    "CLERK_SECRET_KEY",
    "CLERK_ENCRYPTION_KEY",
  ]),
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
