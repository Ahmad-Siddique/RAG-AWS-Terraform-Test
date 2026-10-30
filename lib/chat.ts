import type { Document } from "@/lib/types";

export const SELECTED_DOCS_STORAGE_KEY = "askmydocs-selected-docs";

export function formatChatTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function filterReadyDocuments(documents: Document[]): Document[] {
  return documents.filter((d) => d.status === "ready");
}

export function truncateTitle(title: string, maxLength = 48): string {
  const trimmed = title.trim();
  if (trimmed.length <= maxLength) {
    return trimmed || "New chat";
  }
  return `${trimmed.slice(0, maxLength - 1)}…`;
}

export function loadSelectedDocumentIds(): Set<string> {
  if (typeof window === "undefined") {
    return new Set();
  }
  try {
    const raw = sessionStorage.getItem(SELECTED_DOCS_STORAGE_KEY);
    if (!raw) {
      return new Set();
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return new Set();
    }
    return new Set(parsed.filter((id): id is string => typeof id === "string"));
  } catch {
    return new Set();
  }
}

export function saveSelectedDocumentIds(ids: Set<string>): void {
  if (typeof window === "undefined") {
    return;
  }
  sessionStorage.setItem(
    SELECTED_DOCS_STORAGE_KEY,
    JSON.stringify([...ids]),
  );
}
