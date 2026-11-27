
"use client";

import { useCallback, useEffect, useState } from "react";

type DocumentRecord = {
  id: string;
  documentType: string;
  fileName: string;
  fileSize: number | null;
  mimeType: string | null;
  verified: boolean;
  status: "PENDING" | "VERIFIED" | "REJECTED" | "EXPIRED";
  issuedAt: string | null;
  expiresAt: string | null;
  verifiedAt: string | null;
  uploadedAt: string;
  updatedAt: string;
};

type DocumentsResponse = {
  documents?: DocumentRecord[];
  error?: string;
};

type DocumentGridProps = {
  refreshKey: number;
};

function formatFileSize(bytes: number | null) {
  if (bytes === null || !Number.isFinite(bytes)) {
    return "Size unavailable";
  }

  if (bytes < 1024) {
    return `${bytes} bytes`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(0)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return new Intl.DateTimeFormat("en-ZA", {
    dateStyle: "medium",
  }).format(date);
}

function getStatusClasses(status: DocumentRecord["status"]) {
  switch (status) {
    case "VERIFIED":
      return "bg-green-100 text-green-800";
    case "REJECTED":
      return "bg-red-100 text-red-800";
    case "EXPIRED":
      return "bg-orange-100 text-orange-800";
    case "PENDING":
    default:
      return "bg-amber-100 text-amber-800";
  }
}

export default function DocumentGrid({
  refreshKey,
}: DocumentGridProps) {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const loadDocuments = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/documents", {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
      });

      const data = await response.json() as DocumentsResponse;

      if (!response.ok || !Array.isArray(data.documents)) {
        throw new Error(
          data.error || "Unable to load your organisation's documents.",
        );
      }

      setDocuments(data.documents);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to load documents. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDocuments();
  }, [loadDocuments, refreshKey]);

  return (
    <section className="rounded-2xl bg-white p-6 shadow-xl sm:p-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Your Documents
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Documents stored in your organisation&apos;s private vault.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadDocuments()}
          disabled={isLoading}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {isLoading && (
        <div
          className="rounded-xl bg-slate-50 p-8 text-center text-sm text-gray-600"
          role="status"
          aria-live="polite"
        >
          Loading your documents…
        </div>
      )}

      {!isLoading && errorMessage && (
        <div
          className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800"
          role="alert"
        >
          <p className="font-semibold">Documents could not be loaded.</p>
          <p className="mt-1">{errorMessage}</p>

          <button
            type="button"
            onClick={() => void loadDocuments()}
            className="mt-3 font-semibold underline underline-offset-2"
          >
            Try again
          </button>
        </div>
      )}

      {!isLoading && !errorMessage && documents.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-300 bg-slate-50 p-8 text-center">
          <p className="font-semibold text-gray-800">
            No documents uploaded yet
          </p>
          <p className="mt-2 text-sm text-gray-600">
            Your organisation&apos;s uploaded compliance documents will appear
            here.
          </p>
        </div>
      )}

      {!isLoading && !errorMessage && documents.length > 0 && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {documents.map((document) => (
            <article
              key={document.id}
              className="rounded-xl border border-gray-200 p-5 transition hover:border-blue-200"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <h3 className="break-words font-semibold text-gray-900">
                    {document.fileName}
                  </h3>
                  <p className="mt-1 text-sm text-gray-600">
                    {document.documentType}
                  </p>
                </div>

                <span
                  className={`inline-flex w-fit shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(document.status)}`}
                >
                  {document.status}
                </span>
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-gray-500">File size</dt>
                  <dd className="mt-1 font-medium text-gray-800">
                    {formatFileSize(document.fileSize)}
                  </dd>
                </div>

                <div>
                  <dt className="text-gray-500">Uploaded</dt>
                  <dd className="mt-1 font-medium text-gray-800">
                    {formatDate(document.uploadedAt)}
                  </dd>
                </div>

                <div>
                  <dt className="text-gray-500">Verification</dt>
                  <dd className="mt-1 font-medium text-gray-800">
                    {document.verified ? "Verified" : "Not verified"}
                  </dd>
                </div>

                {document.expiresAt && (
                  <div>
                    <dt className="text-gray-500">Expires</dt>
                    <dd className="mt-1 font-medium text-gray-800">
                      {formatDate(document.expiresAt)}
                    </dd>
                  </div>
                )}
              </dl>

              <div className="mt-5 border-t border-gray-100 pt-4">
                <a
                  href={`/api/documents/${encodeURIComponent(document.id)}/download`}
                  className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  Download document
                </a>
              </div>
            </article>
          ))}
        </div>
      )}

      {!isLoading && !errorMessage && documents.length > 0 && (
        <p className="mt-5 text-xs text-gray-500">
          {documents.length} {documents.length === 1 ? "document" : "documents"}{" "}
          in your vault. Uploading a document does not mean it has been verified.
        </p>
      )}
    </section>
  );
}
