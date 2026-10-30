"use client";

import Link from "next/link";
import { Show } from "@clerk/nextjs";

export function HomeCtas() {
  return (
    <>
      <Show when="signed-out">
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/sign-in"
            className="rounded-lg bg-zinc-900 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="rounded-lg border border-zinc-300 px-6 py-2.5 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-50 dark:hover:bg-zinc-900"
          >
            Sign up
          </Link>
        </div>
      </Show>

      <Show when="signed-in">
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/documents"
            className="rounded-lg bg-zinc-900 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Documents
          </Link>
          <Link
            href="/chat"
            className="rounded-lg border border-zinc-300 px-6 py-2.5 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-50 dark:hover:bg-zinc-900"
          >
            Chat
          </Link>
        </div>
      </Show>
    </>
  );
}
