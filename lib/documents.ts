import type { DocumentStatus } from "@/lib/types";

/** File extension (lowercase) → Content-Type for presigned upload */
export const ACCEPTED_UPLOAD_TYPES: Record<string, string> = {
  ".pdf": "application/pdf",
  ".txt": "text/plain",
};

export const ACCEPTED_FILE_INPUT_ACCEPT =
  Object.keys(ACCEPTED_UPLOAD_TYPES).join(",");

export function getContentTypeForFile(file: File): string | null {
  const lower = file.name.toLowerCase();
  for (const [ext, contentType] of Object.entries(ACCEPTED_UPLOAD_TYPES)) {
    if (lower.endsWith(ext)) {
      return contentType;
    }
  }
  return null;
}

export function formatDocumentDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function isProcessingStatus(status: DocumentStatus): boolean {
  return status === "processing";
}

export type UploadProgressStep = "creating" | "uploading" | "processing";

export type DocumentUploadApi = {
  createDocument: (
    filename: string,
    content_type: string,
  ) => Promise<{ document_id: string; upload_url: string }>;
  uploadFileToPresignedUrl: (
    uploadUrl: string,
    file: Blob,
    contentType: string,
  ) => Promise<void>;
  processDocument: (documentId: string) => Promise<unknown>;
};

/** create → PUT to S3 → start processing */
export async function runDocumentUploadPipeline(
  file: File,
  api: DocumentUploadApi,
  onStep?: (step: UploadProgressStep) => void,
): Promise<string> {
  const contentType = getContentTypeForFile(file);
  if (!contentType) {
    throw new Error("Only PDF and plain text (.txt) files are supported.");
  }

  onStep?.("creating");
  const created = await api.createDocument(file.name, contentType);

  onStep?.("uploading");
  await api.uploadFileToPresignedUrl(created.upload_url, file, contentType);

  onStep?.("processing");
  await api.processDocument(created.document_id);

  return created.document_id;
}
