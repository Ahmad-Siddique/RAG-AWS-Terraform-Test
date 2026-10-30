"use client";

import { useRef, useState } from "react";
import {
  ACCEPTED_FILE_INPUT_ACCEPT,
  getContentTypeForFile,
  type UploadProgressStep,
} from "@/lib/documents";

const STEP_LABELS: Record<UploadProgressStep, string> = {
  creating: "Creating document record…",
  uploading: "Uploading file to storage…",
  processing: "Starting processing…",
};

type DocumentUploadZoneProps = {
  disabled: boolean;
  uploadStep: UploadProgressStep | null;
  onUpload: (file: File) => void | Promise<void>;
};

export function DocumentUploadZone({
  disabled,
  uploadStep,
  onUpload,
}: DocumentUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const busy = disabled || uploadStep !== null;

  function pickFile() {
    if (!busy) {
      inputRef.current?.click();
    }
  }

  function handleFile(file: File | undefined) {
    if (!file || busy) {
      return;
    }
    setLocalError(null);
    if (!getContentTypeForFile(file)) {
      setLocalError("Only PDF and .txt files are supported.");
      return;
    }
    void onUpload(file);
  }

  return (
    <div className="space-y-3">
      <div
        role="button"
        tabIndex={busy ? -1 : 0}
        onClick={pickFile}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            pickFile();
          }
        }}
        onDragEnter={(e) => {
          e.preventDefault();
          if (!busy) {
            setDragOver(true);
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!busy) {
            setDragOver(true);
          }
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setDragOver(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (busy) {
            return;
          }
          const file = e.dataTransfer.files[0];
          handleFile(file);
        }}
        className={`rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors ${
          busy
            ? "cursor-not-allowed border-zinc-200 bg-zinc-50 opacity-60 dark:border-zinc-800 dark:bg-zinc-900/50"
            : dragOver
              ? "cursor-pointer border-zinc-900 bg-zinc-50 dark:border-zinc-300 dark:bg-zinc-900"
              : "cursor-pointer border-zinc-300 bg-white hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:hover:border-zinc-500"
        }`}
      >
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
          {busy ? "Upload in progress…" : "Drop a file here or click to browse"}
        </p>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          PDF or plain text (.txt)
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_FILE_INPUT_ACCEPT}
          className="hidden"
          disabled={busy}
          onChange={(e) => {
            const file = e.target.files?.[0];
            handleFile(file);
            e.target.value = "";
          }}
        />
      </div>

      {uploadStep !== null && (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {STEP_LABELS[uploadStep]}
        </p>
      )}

      {localError !== null && (
        <p className="text-sm text-red-600 dark:text-red-400">{localError}</p>
      )}
    </div>
  );
}
