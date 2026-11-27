import * as yauzl from "yauzl";

const MAX_DOCX_ENTRIES = 1000;
const MAX_DOCX_UNCOMPRESSED_SIZE = 100 * 1024 * 1024;
const MAX_DOCX_XML_ENTRY_SIZE = 2 * 1024 * 1024;

const REQUIRED_DOCX_ENTRIES = [
  "[Content_Types].xml",
  "_rels/.rels",
  "word/document.xml",
] as const;

async function readZipEntryText(
  zipFile: yauzl.ZipFile,
  entry: yauzl.Entry,
): Promise<string | null> {
  if (
    !Number.isSafeInteger(entry.uncompressedSize) ||
    entry.uncompressedSize < 1 ||
    entry.uncompressedSize > MAX_DOCX_XML_ENTRY_SIZE
  ) {
    return null;
  }

  const stream = await zipFile.openReadStreamPromise(entry);

  const chunks: Buffer[] = [];

  let totalSize = 0;
  let exceededLimit = false;

  try {
    for await (const chunk of stream) {
      const data = Buffer.isBuffer(chunk)
        ? chunk
        : Buffer.from(chunk);

      totalSize += data.length;

      if (totalSize > MAX_DOCX_XML_ENTRY_SIZE) {
        exceededLimit = true;
        break;
      }

      chunks.push(data);
    }
  } finally {
    // Do not leave a partially consumed ZIP entry stream open.
    if (!stream.readableEnded && !stream.destroyed) {
      stream.destroy();
    }
  }

  if (exceededLimit) {
    return null;
  }

  if (totalSize !== entry.uncompressedSize) {
    return null;
  }

  return Buffer.concat(chunks).toString("utf8");
}

async function validateDocx(buffer: Buffer): Promise<boolean> {
  try {
    if (
      buffer.length < 4 ||
      buffer[0] !== 0x50 ||
      buffer[1] !== 0x4b ||
      buffer[2] !== 0x03 ||
      buffer[3] !== 0x04
    ) {
      return false;
    }

    const zipFile = await yauzl.fromBufferPromise(buffer, {
      lazyEntries: true,
      validateEntrySizes: true,
      strictFileNames: true,
      autoClose: true,
    });

    const requiredContent = new Map<string, string>();
    const seenNames = new Set<string>();

    let entryCount = 0;
    let totalUncompressedSize = 0;

    for await (const entry of zipFile.eachEntry()) {
      entryCount += 1;

      if (entryCount > MAX_DOCX_ENTRIES) {
        return false;
      }

      const name = entry.fileName;

      if (
        !name ||
        name.includes("\\") ||
        name.startsWith("/") ||
        name.includes("\0") ||
        name.split("/").includes("..")
      ) {
        return false;
      }

      if (
        !Number.isSafeInteger(entry.uncompressedSize) ||
        !Number.isSafeInteger(entry.compressedSize) ||
        entry.uncompressedSize < 0 ||
        entry.compressedSize < 0
      ) {
        return false;
      }

      // Reject encrypted entries.
      if ((entry.generalPurposeBitFlag & 0x0001) !== 0) {
        return false;
      }

      // Accept only ZIP storage and DEFLATE compression.
      if (
        entry.compressionMethod !== 0 &&
        entry.compressionMethod !== 8
      ) {
        return false;
      }

      totalUncompressedSize += entry.uncompressedSize;

      if (
        totalUncompressedSize >
        MAX_DOCX_UNCOMPRESSED_SIZE
      ) {
        return false;
      }

      if (
        entry.uncompressedSize > 0 &&
        entry.compressedSize === 0
      ) {
        return false;
      }

      if (seenNames.has(name)) {
        return false;
      }

      seenNames.add(name);

      const isRequiredEntry =
        REQUIRED_DOCX_ENTRIES.includes(
          name as (typeof REQUIRED_DOCX_ENTRIES)[number],
        );

      if (!isRequiredEntry) {
        continue;
      }

      if (name.endsWith("/")) {
        return false;
      }

      const content = await readZipEntryText(
        zipFile,
        entry,
      );

      if (content === null) {
        return false;
      }

      requiredContent.set(name, content);
    }

    for (const requiredName of REQUIRED_DOCX_ENTRIES) {
      if (!requiredContent.has(requiredName)) {
        return false;
      }
    }

    const contentTypes = requiredContent.get(
      "[Content_Types].xml",
    );

    const relationships = requiredContent.get(
      "_rels/.rels",
    );

    const documentXml = requiredContent.get(
      "word/document.xml",
    );

    if (!contentTypes || !relationships || !documentXml) {
      return false;
    }

    if (
      !contentTypes.includes(
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml",
      )
    ) {
      return false;
    }

    if (
      !relationships.includes("officeDocument") ||
      !relationships.includes("word/document.xml")
    ) {
      return false;
    }

    if (
      !/<(?:[A-Za-z_][\w.-]*:)?document(?:\s|>)/.test(
        documentXml,
      )
    ) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

export async function validateDocumentFile(
  buffer: Buffer,
  contentType: string,
): Promise<boolean> {
  if (!Buffer.isBuffer(buffer) || buffer.length < 4) {
    return false;
  }

  switch (contentType) {
    case "application/pdf":
      return (
        buffer.length >= 5 &&
        buffer.subarray(0, 5).toString("ascii") === "%PDF-"
      );

    case "image/png":
      return (
        buffer.length >= 8 &&
        buffer.subarray(0, 8).equals(
          Buffer.from([
            0x89,
            0x50,
            0x4e,
            0x47,
            0x0d,
            0x0a,
            0x1a,
            0x0a,
          ]),
        )
      );

    case "image/jpeg":
      return (
        buffer.length >= 3 &&
        buffer[0] === 0xff &&
        buffer[1] === 0xd8 &&
        buffer[2] === 0xff
      );

    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      return validateDocx(buffer);

    default:
      return false;
  }
}