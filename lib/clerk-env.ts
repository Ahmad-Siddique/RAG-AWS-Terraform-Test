/**
 * Resolve Clerk publishable key for local dev, Vercel, and CI.
 * Vercel / Clerk integrations often set CLERK_PUBLISHABLE_KEY without the NEXT_PUBLIC_ prefix.
 */
export function getClerkPublishableKey(): string {
  const fromPublic = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim();
  if (fromPublic) {
    return fromPublic;
  }
  return process.env.CLERK_PUBLISHABLE_KEY?.trim() ?? "";
}

export const missingClerkPublishableKeyMessage =
  "Missing Clerk publishable key. Set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY (or CLERK_PUBLISHABLE_KEY) in Vercel → Project Settings → Environment Variables for Production and Preview, then redeploy.";
