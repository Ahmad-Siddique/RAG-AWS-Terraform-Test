"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import {
  isProcessingStatus,
  runDocumentUploadPipeline,
  type UploadProgressStep,
} from "@/lib/documents";
import type { Document } from "@/lib/types";
import { useAskMyDocsApi } from "@/hooks/useAskMyDocsApi";

function errorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    return err.message;
  }
  if (err instanceof Error) {
    return err.message;
  }
  return "Something went wrong";
}

export function useDocumentsPage() {
  const api = useAskMyDocsApi();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadStep, setUploadStep] = useState<UploadProgressStep | null>(
    null,
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const dismissError = useCallback(() => setError(null), []);

  const refreshDocuments = useCallback(async () => {
    try {
      const docs = await api.listDocuments();
      setDocuments(docs);
    } catch (err) {
      setError(errorMessage(err));
    }
  }, [api]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const docs = await api.listDocuments();
        if (!cancelled) {
          setDocuments(docs);
        }
      } catch (err) {
        if (!cancelled) {
          setError(errorMessage(err));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [api]);

  const hasProcessing = documents.some((d) => isProcessingStatus(d.status));

  useEffect(() => {
    if (!hasProcessing) {
      return;
    }
    const intervalId = window.setInterval(() => {
      void refreshDocuments();
    }, 3000);
    return () => window.clearInterval(intervalId);
  }, [hasProcessing, refreshDocuments]);

  const uploadInProgress = uploadStep !== null;

  const uploadFile = useCallback(
    async (file: File) => {
      if (uploadStep !== null) {
        return;
      }
      setError(null);
      try {
        await runDocumentUploadPipeline(
          file,
          {
            createDocument: api.createDocument,
            uploadFileToPresignedUrl: api.uploadFileToPresignedUrl,
            processDocument: api.processDocument,
          },
          setUploadStep,
        );
        await refreshDocuments();
      } catch (err) {
        setError(errorMessage(err));
      } finally {
        setUploadStep(null);
      }
    },
    [api, refreshDocuments, uploadStep],
  );

  const deleteDocument = useCallback(
    async (documentId: string, filename: string) => {
      if (
        !window.confirm(
          `Delete "${filename}"? This removes the file and its indexed chunks.`,
        )
      ) {
        return;
      }
      setDeletingId(documentId);
      setError(null);
      try {
        await api.deleteDocument(documentId);
        setDocuments((prev) =>
          prev.filter((d) => d.document_id !== documentId),
        );
      } catch (err) {
        setError(errorMessage(err));
      } finally {
        setDeletingId(null);
      }
    },
    [api],
  );

  return {
    documents,
    loading,
    error,
    dismissError,
    uploadStep,
    uploadInProgress,
    uploadFile,
    deleteDocument,
    deletingId,
  };
}
