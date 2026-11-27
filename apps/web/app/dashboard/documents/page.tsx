
"use client";

import { useState } from "react";

import UploadCard from "@/components/documents/UploadCard";
import DocumentGrid from "@/components/documents/DocumentGrid";

export default function DocumentsPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  function handleUploadComplete() {
    setRefreshKey((current) => current + 1);
  }

  return (
    <main className="min-h-screen bg-slate-100 p-6 sm:p-10">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Document Center
          </h1>

          <p className="mt-2 text-gray-600">
            Manage your organisation&apos;s compliance documents in one
            secure place.
          </p>
        </header>

        <div className="space-y-8">
          <UploadCard onUploadComplete={handleUploadComplete} />

          <DocumentGrid refreshKey={refreshKey} />
        </div>
      </div>
    </main>
  );
}
