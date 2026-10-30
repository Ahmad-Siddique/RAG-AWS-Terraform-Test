"use client";

import { formatDocumentDate } from "@/lib/documents";
import type { Document } from "@/lib/types";
import { DocumentStatusBadge } from "@/components/documents/DocumentStatusBadge";

type DocumentListProps = {
  documents: Document[];
  deletingId: string | null;
  onDelete: (documentId: string, filename: string) => void;
};

export function DocumentList({
  documents,
  deletingId,
  onDelete,
}: DocumentListProps) {
  if (documents.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-6 py-12 text-center dark:border-zinc-800 dark:bg-zinc-900/40">
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
          No documents yet
        </p>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Upload a PDF or text file to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-zinc-200 text-sm dark:divide-zinc-800">
          <thead className="bg-zinc-50 dark:bg-zinc-900/60">
            <tr>
              <th
                scope="col"
                className="px-4 py-3 text-left font-medium text-zinc-600 dark:text-zinc-400"
              >
                File
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left font-medium text-zinc-600 dark:text-zinc-400"
              >
                Status
              </th>
              <th
                scope="col"
                className="hidden px-4 py-3 text-left font-medium text-zinc-600 sm:table-cell dark:text-zinc-400"
              >
                Chunks
              </th>
              <th
                scope="col"
                className="hidden px-4 py-3 text-left font-medium text-zinc-600 md:table-cell dark:text-zinc-400"
              >
                Updated
              </th>
              <th scope="col" className="relative px-4 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-800 dark:bg-zinc-950">
            {documents.map((doc) => {
              const isDeleting = deletingId === doc.document_id;
              return (
                <tr key={doc.document_id}>
                  <td className="px-4 py-3 align-top">
                    <div className="font-medium text-zinc-900 dark:text-zinc-50">
                      {doc.filename}
                    </div>
                    {doc.status === "failed" && doc.error && (
                      <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                        {doc.error}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-zinc-500 sm:hidden dark:text-zinc-400">
                      {doc.chunk_count} chunks ·{" "}
                      {formatDocumentDate(doc.updated_at)}
                    </p>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <DocumentStatusBadge status={doc.status} />
                  </td>
                  <td className="hidden px-4 py-3 align-top text-zinc-700 sm:table-cell dark:text-zinc-300">
                    {doc.status === "ready" ? doc.chunk_count : "—"}
                  </td>
                  <td className="hidden px-4 py-3 align-top text-zinc-600 md:table-cell dark:text-zinc-400">
                    {formatDocumentDate(doc.updated_at)}
                  </td>
                  <td className="px-4 py-3 align-top text-right">
                    <button
                      type="button"
                      disabled={isDeleting}
                      onClick={() =>
                        onDelete(doc.document_id, doc.filename)
                      }
                      className="rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-950/40"
                    >
                      {isDeleting ? "Deleting…" : "Delete"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
