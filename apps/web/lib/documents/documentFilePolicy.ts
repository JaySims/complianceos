const EXPECTED_EXTENSIONS: Record<string, string[]> = {
  "application/pdf": ["pdf"],
  "image/png": ["png"],
  "image/jpeg": ["jpg", "jpeg"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
    "docx",
  ],
};

export function isAllowedDocumentFileExtension(
  fileName: string,
  contentType: string,
): boolean {
  const extension = fileName.toLowerCase().split(".").pop();

  if (!extension) {
    return false;
  }

  return EXPECTED_EXTENSIONS[contentType]?.includes(extension) ?? false;
}