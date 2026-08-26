"use client";

import { useRef, useState } from "react";

export default function UploadCard() {
  const inputRef = useRef<HTMLInputElement>(null);

  const [fileName, setFileName] = useState("");

  function chooseFile() {
    inputRef.current?.click();
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    if (!e.target.files?.length) return;

    setFileName(e.target.files[0].name);
  }

  return (
    <div className="rounded-2xl bg-white shadow-xl p-8">

      <h2 className="text-2xl font-bold mb-4">
        Upload Compliance Document
      </h2>

      <div
        onClick={chooseFile}
        className="border-2 border-dashed border-blue-400 rounded-xl p-16 text-center cursor-pointer hover:bg-blue-50 transition"
      >
        <p className="text-lg font-medium">
          Click to upload
        </p>

        <p className="text-gray-500 mt-2">
          PDF, PNG or JPG
        </p>

        {fileName && (
          <p className="mt-6 text-green-600 font-semibold">
            {fileName}
          </p>
        )}

        <input
          ref={inputRef}
          type="file"
          hidden
          onChange={handleChange}
        />
      </div>

    </div>
  );
}
