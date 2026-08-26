"use client";

type DocumentItem = {
  name: string;
  uploaded: boolean;
};

type Props = {
  documents: DocumentItem[];
};

export default function DocumentChecklist({
  documents,
}: Props) {
  const uploadedCount = documents.filter(
    (doc) => doc.uploaded
  ).length;

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">

      <div className="flex items-center justify-between mb-6">

        <h3 className="text-xl font-semibold text-slate-900">
          Document Checklist
        </h3>

        <span className="text-sm text-slate-500">
          {uploadedCount}/{documents.length} Uploaded
        </span>

      </div>

      <div className="space-y-4">

        {documents.map((doc, index) => (

          <div
            key={index}
            className="flex items-center justify-between border rounded-lg p-4"
          >

            <span className="font-medium text-slate-700">
              {doc.name}
            </span>

            {doc.uploaded ? (

              <span className="text-emerald-600 font-semibold">
                ✅ Uploaded
              </span>

            ) : (

              <span className="text-red-500 font-semibold">
                ❌ Missing
              </span>

            )}

          </div>

        ))}

      </div>

    </div>
  );
}
