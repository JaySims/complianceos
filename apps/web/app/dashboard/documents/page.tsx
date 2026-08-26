import UploadCard from "@/components/documents/UploadCard";

export default function DocumentsPage() {
  return (
    <main className="p-10 bg-slate-100 min-h-screen">

      <h1 className="text-4xl font-bold mb-8">
        Document Center
      </h1>

      <UploadCard />

    </main>
  );
}
