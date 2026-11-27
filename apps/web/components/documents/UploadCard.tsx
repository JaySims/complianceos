
"use client";

import { useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";

const MAX_FILE_SIZE = 25 * 1024 * 1024;

const DOCUMENT_TYPES = [
  "Company Registration Certificate",
  "Tax Clearance Certificate",
  "VAT Registration",
  "B-BBEE Certificate",
  "Memorandum of Incorporation (MOI)",
  "Shareholder Register",
  "Directors Register",
  "POPIA Policy",
] as const;

const ALLOWED_CONTENT_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

type DocumentType = (typeof DOCUMENT_TYPES)[number];

type UploadUrlResponse = {
  uploadUrl?: string;
  pathname?: string;
  intentToken?: string;
  error?: string;
};

type FinalizeResponse = {
  document?: {
    id: string;
    documentType: string;
    fileName: string;
    fileSize: number | null;
    mimeType: string | null;
    status: string;
    uploadedAt: string;
  };
  error?: string;
};

type UploadStage =
  | "idle"
  | "uploading"
  | "finalizing"
  | "success"
  | "error";

type UploadCardProps = {
  onUploadComplete?: () => void;
};

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(0)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

async function readJson<T>(response: Response): Promise<T> {
  return response.json() as Promise<T>;
}

function uploadFileToBlob(
  uploadUrl: string,
  file: File,
  onProgress: (percentage: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.open("PUT", uploadUrl);
    xhr.setRequestHeader("Content-Type", file.type);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && event.total > 0) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress(100);
        resolve();
        return;
      }

      reject(
        new Error(
          `Storage rejected the upload (HTTP ${xhr.status}). Please try again.`,
        ),
      );
    };

    xhr.onerror = () => {
      reject(
        new Error(
          "A network error interrupted the upload. Please try again.",
        ),
      );
    };

    xhr.onabort = () => {
      reject(new Error("The upload was interrupted."));
    };

    xhr.send(file);
  });
}

export default function UploadCard({
  onUploadComplete,
}: UploadCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [documentType, setDocumentType] =
    useState<DocumentType>(DOCUMENT_TYPES[0]);
  const [stage, setStage] = useState<UploadStage>("idle");
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [uploadedDocument, setUploadedDocument] =
    useState<FinalizeResponse["document"]>(undefined);

  const isBusy = stage === "uploading" || stage === "finalizing";

  function chooseFile() {
    if (!isBusy) {
      inputRef.current?.click();
    }
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) return;

    setErrorMessage("");
    setUploadedDocument(undefined);
    setProgress(0);

    if (selectedFile.size < 1 || selectedFile.size > MAX_FILE_SIZE) {
      setFile(null);
      setStage("error");
      setErrorMessage("Choose a file between 1 byte and 25 MB.");
      event.target.value = "";
      return;
    }

    if (
      !ALLOWED_CONTENT_TYPES.includes(
        selectedFile.type as (typeof ALLOWED_CONTENT_TYPES)[number],
      )
    ) {
      setFile(null);
      setStage("error");
      setErrorMessage(
        "Unsupported file type. Choose a PDF, PNG, JPEG or DOCX file.",
      );
      event.target.value = "";
      return;
    }

    setFile(selectedFile);
    setStage("idle");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!file || isBusy) return;

    setErrorMessage("");
    setUploadedDocument(undefined);
    setProgress(0);

    try {
      setStage("uploading");

      // Step 1: Request a short-lived, organisation-scoped upload URL.
      const urlResponse = await fetch("/api/documents/upload-url", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type,
          fileSize: file.size,
          documentType,
        }),
      });

      const urlData = await readJson<UploadUrlResponse>(urlResponse);

      if (
        !urlResponse.ok ||
        !urlData.uploadUrl ||
        !urlData.pathname ||
        !urlData.intentToken
      ) {
        throw new Error(
          urlData.error || "Unable to prepare the document upload.",
        );
      }

      // Step 2: Upload the file directly to private Blob storage.
      await uploadFileToBlob(urlData.uploadUrl, file, setProgress);

      // Step 3: Ask the server to verify the stored object and create
      // its pending-verification database record.
      setStage("finalizing");

      const finalizeResponse = await fetch("/api/documents/finalize", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pathname: urlData.pathname,
          intentToken: urlData.intentToken,
        }),
      });

      const finalizeData =
        await readJson<FinalizeResponse>(finalizeResponse);

      if (!finalizeResponse.ok || !finalizeData.document) {
        throw new Error(
          finalizeData.error ||
            "The file was uploaded, but its document record could not be finalized. Please contact support before retrying.",
        );
      }

      setUploadedDocument(finalizeData.document);
      setStage("success");
      setProgress(100);
      setFile(null);

      if (inputRef.current) {
        inputRef.current.value = "";
      }

      // Notify the document list only after successful finalization.
      onUploadComplete?.();
    } catch (error) {
      setStage("error");
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "The upload failed. Please try again.",
      );
    }
  }

  function resetUpload() {
    if (isBusy) return;

    setFile(null);
    setProgress(0);
    setErrorMessage("");
    setUploadedDocument(undefined);
    setStage("idle");

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  return (
    <section className="rounded-2xl bg-white p-6 shadow-xl sm:p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Upload Compliance Document
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Upload a document to your organisation&apos;s private document
          vault. Uploaded documents remain pending until separately verified.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="documentType"
            className="mb-2 block text-sm font-semibold text-gray-800"
          >
            Document type
          </label>

          <select
            id="documentType"
            value={documentType}
            onChange={(event) =>
              setDocumentType(event.target.value as DocumentType)
            }
            disabled={isBusy}
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
          >
            {DOCUMENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div
          onClick={chooseFile}
          onKeyDown={(event) => {
            if (
              !isBusy &&
              (event.key === "Enter" || event.key === " ")
            ) {
              event.preventDefault();
              chooseFile();
            }
          }}
          role="button"
          tabIndex={isBusy ? -1 : 0}
          aria-label="Choose a compliance document"
          aria-disabled={isBusy}
          className={`rounded-xl border-2 border-dashed border-blue-400 p-8 text-center transition sm:p-12 ${
            isBusy
              ? "cursor-not-allowed bg-gray-50 opacity-70"
              : "cursor-pointer hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          }`}
        >
          <div className="mb-3 text-3xl" aria-hidden="true">
            ↑
          </div>

          <p className="text-lg font-semibold text-gray-900">
            {file ? "Document selected" : "Click to choose a document"}
          </p>

          <p className="mt-2 text-sm text-gray-500">
            PDF, PNG, JPEG or DOCX · Maximum 25 MB
          </p>

          {file && (
            <div className="mt-5 rounded-lg bg-blue-50 p-4 text-left">
              <p className="break-words font-semibold text-blue-900">
                {file.name}
              </p>
              <p className="mt-1 text-sm text-blue-700">
                {formatFileSize(file.size)}
              </p>
            </div>
          )}

          <input
            ref={inputRef}
            id="documentFile"
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.docx,application/pdf,image/png,image/jpeg,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            hidden
            disabled={isBusy}
            onChange={handleChange}
          />
        </div>

        {(stage === "uploading" || stage === "finalizing") && (
          <div
            className="space-y-2"
            aria-live="polite"
            aria-atomic="true"
          >
            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="font-medium text-gray-700">
                {stage === "uploading"
                  ? "Uploading to private storage…"
                  : "Verifying upload and saving document record…"}
              </span>
              <span className="font-semibold tabular-nums text-blue-700">
                {stage === "uploading" ? `${progress}%` : "Please wait"}
              </span>
            </div>

            <div
              className="h-2 overflow-hidden rounded-full bg-gray-200"
              role="progressbar"
              aria-label="Document upload progress"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={stage === "uploading" ? progress : 100}
            >
              <div
                className={`h-full rounded-full bg-blue-600 transition-all duration-200 ${
                  stage === "finalizing" ? "animate-pulse" : ""
                }`}
                style={{
                  width: `${stage === "uploading" ? progress : 100}%`,
                }}
              />
            </div>
          </div>
        )}

        {stage === "error" && errorMessage && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          >
            <p className="font-semibold">Upload needs attention</p>
            <p className="mt-1 break-words">{errorMessage}</p>
            <p className="mt-2 text-xs">
              If storage completed but finalization failed, the uploaded file
              may still exist in private storage. Do not assume it was saved
              to your document vault.
            </p>
          </div>
        )}

        {stage === "success" && uploadedDocument && (
          <div
            role="status"
            className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-900"
          >
            <p className="font-semibold">Document uploaded successfully.</p>
            <p className="mt-1 break-words">
              {uploadedDocument.fileName}
            </p>
            <p className="mt-1">
              Verification status:{" "}
              <span className="font-semibold">
                {uploadedDocument.status}
              </span>
            </p>
            <p className="mt-2 text-xs text-green-800">
              Uploading does not constitute compliance approval or document
              verification.
            </p>
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="submit"
            disabled={!file || isBusy}
            className="inline-flex flex-1 items-center justify-center rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {stage === "uploading"
              ? "Uploading…"
              : stage === "finalizing"
                ? "Finalizing…"
                : "Upload Document"}
          </button>

          {(file || stage === "success" || stage === "error") && (
            <button
              type="button"
              onClick={resetUpload}
              disabled={isBusy}
              className="rounded-xl border border-gray-300 px-5 py-3 font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {stage === "success" ? "Upload another" : "Clear"}
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
