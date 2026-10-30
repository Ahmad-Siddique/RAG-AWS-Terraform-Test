"use client";

import { DocumentList } from "@/components/documents/DocumentList";
import { DocumentUploadZone } from "@/components/documents/DocumentUploadZone";
import { useDocumentsPage } from "@/hooks/useDocumentsPage";

export default function DocumentsPage() {
  const {
    documents,
    loading,
    error,
    dismissError,
    uploadStep,
    uploadInProgress,
    uploadFile,
    deleteDocument,
    deletingId,
  } = useDocumentsPage();

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        Documents
      </h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        Upload PDF or text files. They are chunked, embedded, and indexed for
        chat.
      </p>

      {error !== null && (
        <div
          role="alert"
          className="mt-6 flex items-start justify-between gap-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
        >
          <p>{error}</p>
          <button
            type="button"
            onClick={dismissError}
            className="shrink-0 font-medium underline-offset-2 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      <section className="mt-8">
        <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
          Upload
        </h2>
        <div className="mt-3">
          <DocumentUploadZone
            disabled={uploadInProgress}
            uploadStep={uploadStep}
            onUpload={uploadFile}
          />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
          Your documents
        </h2>
        <div className="mt-3">
          {loading ? (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Loading documents…
            </p>
          ) : (
            <DocumentList
              documents={documents}
              deletingId={deletingId}
              onDelete={deleteDocument}
            />
          )}
        </div>
      </section>
    </div>
  );
}
