"use client";

import type { DocumentStatus } from "@/lib/types";

const styles: Record<DocumentStatus, string> = {
  processing:
    "bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200",
  ready:
    "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200",
  failed: "bg-red-100 text-red-900 dark:bg-red-950/60 dark:text-red-200",
};

const labels: Record<DocumentStatus, string> = {
  processing: "Processing",
  ready: "Ready",
  failed: "Failed",
};

export function DocumentStatusBadge({ status }: { status: DocumentStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}
