"use client";

import type { Document } from "@/lib/types";

type DocumentPickerProps = {
  readyDocuments: Document[];
  selectedDocumentIds: Set<string>;
  onToggle: (documentId: string) => void;
  onSelectAll: () => void;
  onSelectNone: () => void;
};

export function DocumentPicker({
  readyDocuments,
  selectedDocumentIds,
  onToggle,
  onSelectAll,
  onSelectNone,
}: DocumentPickerProps) {
  return (
    <section className="border-b border-slate-800/80 px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xs font-medium uppercase tracking-wider text-slate-500">
          Context
        </h2>
        {readyDocuments.length > 0 && (
          <div className="flex gap-2 text-[0.6875rem]">
            <button
              type="button"
              onClick={onSelectAll}
              className="font-medium text-slate-500 transition-colors hover:text-cyan-400/90"
            >
              All
            </button>
            <span className="text-slate-700">/</span>
            <button
              type="button"
              onClick={onSelectNone}
              className="font-medium text-slate-500 transition-colors hover:text-cyan-400/90"
            >
              None
            </button>
          </div>
        )}
      </div>

      {readyDocuments.length === 0 ? (
        <p className="mt-2 text-sm text-slate-500">
          No ready documents. Upload and process files on the Documents page
          first.
        </p>
      ) : (
        <ul className="mt-2.5 max-h-28 space-y-1.5 overflow-y-auto sm:max-h-32">
          {readyDocuments.map((doc) => {
            const checked = selectedDocumentIds.has(doc.document_id);
            return (
              <li key={doc.document_id}>
                <label className="flex cursor-pointer items-start gap-2.5 rounded-md px-1 py-0.5 text-sm transition-colors hover:bg-slate-900/40">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggle(doc.document_id)}
                    className="mt-0.5 rounded border-slate-600 bg-slate-900 text-cyan-500 focus:ring-cyan-500/30"
                  />
                  <span className="min-w-0 flex-1 text-slate-300">
                    <span className="block truncate font-medium">
                      {doc.filename}
                    </span>
                    <span className="text-[0.6875rem] text-slate-600">
                      {doc.chunk_count} chunks
                    </span>
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
