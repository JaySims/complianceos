import {
  describe,
  expect,
  it,
} from "vitest";

import {
  validateDocumentFile,
} from "../lib/documents/validateDocumentFile";

import { Buffer } from "node:buffer";

type ZipFixtureEntry = {
  name: string;
  content: string;
};

function calculateCrc32(buffer: Buffer): number {
  let crc = 0xffffffff;

  for (const byte of buffer) {
    crc ^= byte;

    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (
        (crc & 1) !== 0
          ? 0xedb88320
          : 0
      );
    }
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function createZipFixture(
  entries: ZipFixtureEntry[],
): Buffer {
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];

  let localOffset = 0;

  for (const entry of entries) {
    const name = Buffer.from(entry.name, "utf8");
    const content = Buffer.from(entry.content, "utf8");
    const crc = calculateCrc32(content);

    const localHeader = Buffer.alloc(30);

    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0, 6);
    localHeader.writeUInt16LE(0, 8);
    localHeader.writeUInt16LE(0, 10);
    localHeader.writeUInt16LE(0, 12);
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(content.length, 18);
    localHeader.writeUInt32LE(content.length, 22);
    localHeader.writeUInt16LE(name.length, 26);
    localHeader.writeUInt16LE(0, 28);

    localParts.push(
      localHeader,
      name,
      content,
    );

    const centralHeader = Buffer.alloc(46);

    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0, 8);
    centralHeader.writeUInt16LE(0, 10);
    centralHeader.writeUInt16LE(0, 12);
    centralHeader.writeUInt16LE(0, 14);
    centralHeader.writeUInt32LE(crc, 16);
    centralHeader.writeUInt32LE(content.length, 20);
    centralHeader.writeUInt32LE(content.length, 24);
    centralHeader.writeUInt16LE(name.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(localOffset, 42);

    centralParts.push(
      centralHeader,
      name,
    );

    localOffset +=
      localHeader.length +
      name.length +
      content.length;
  }

  const centralDirectory = Buffer.concat(centralParts);
  const localFileData = Buffer.concat(localParts);

  const endRecord = Buffer.alloc(22);

  endRecord.writeUInt32LE(0x06054b50, 0);
  endRecord.writeUInt16LE(0, 4);
  endRecord.writeUInt16LE(0, 6);
  endRecord.writeUInt16LE(entries.length, 8);
  endRecord.writeUInt16LE(entries.length, 10);
  endRecord.writeUInt32LE(centralDirectory.length, 12);
  endRecord.writeUInt32LE(localOffset, 16);
  endRecord.writeUInt16LE(0, 20);

  return Buffer.concat([
    localFileData,
    centralDirectory,
    endRecord,
  ]);
}

function createValidDocxFixture(): Buffer {
  return createZipFixture([
    {
      name: "[Content_Types].xml",
      content: [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">',
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>',
        '<Default Extension="xml" ContentType="application/xml"/>',
        '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>',
        "</Types>",
      ].join(""),
    },
    {
      name: "_rels/.rels",
      content: [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">',
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>',
        "</Relationships>",
      ].join(""),
    },
    {
      name: "word/document.xml",
      content: [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">',
        "<w:body><w:p><w:r><w:t>ComplianceOS test document</w:t></w:r></w:p></w:body>",
        "</w:document>",
      ].join(""),
    },
  ]);
}

describe("validateDocumentFile", () => {
  describe("PDF validation", () => {
    it("accepts a PDF signature", async () => {
      const buffer = Buffer.from(
        "%PDF-1.7\n",
        "ascii",
      );

      await expect(
        validateDocumentFile(buffer, "application/pdf"),
      ).resolves.toBe(true);
    });

    it("rejects a file without a PDF signature", async () => {
      const buffer = Buffer.from(
        "This is not a PDF",
        "utf8",
      );

      await expect(
        validateDocumentFile(buffer, "application/pdf"),
      ).resolves.toBe(false);
    });
  });

  describe("PNG validation", () => {
    it("accepts a PNG signature", async () => {
      const buffer = Buffer.from([
        0x89,
        0x50,
        0x4e,
        0x47,
        0x0d,
        0x0a,
        0x1a,
        0x0a,
      ]);

      await expect(
        validateDocumentFile(buffer, "image/png"),
      ).resolves.toBe(true);
    });

    it("rejects an invalid PNG signature", async () => {
      const buffer = Buffer.from(
        "NOTPNG!!",
        "ascii",
      );

      await expect(
        validateDocumentFile(buffer, "image/png"),
      ).resolves.toBe(false);
    });
  });

  describe("JPEG validation", () => {
    it("accepts a JPEG signature", async () => {
      const buffer = Buffer.from([
        0xff,
        0xd8,
        0xff,
        0xd9,
      ]);

      await expect(
        validateDocumentFile(buffer, "image/jpeg"),
      ).resolves.toBe(true);
    });

    it("rejects an invalid JPEG signature", async () => {
      const buffer = Buffer.from(
        "NOTJPEG",
        "ascii",
      );

      await expect(
        validateDocumentFile(buffer, "image/jpeg"),
      ).resolves.toBe(false);
    });
  });

  describe("DOCX validation", () => {
    const docxMimeType =
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    it("accepts a structurally valid DOCX ZIP container", async () => {
      const buffer = createValidDocxFixture();

      await expect(
        validateDocumentFile(buffer, docxMimeType),
      ).resolves.toBe(true);
    });

    it("rejects a DOCX file with an invalid ZIP signature", async () => {
      const buffer = Buffer.from(
        "NOTAZIP",
        "ascii",
      );

      await expect(
        validateDocumentFile(buffer, docxMimeType),
      ).resolves.toBe(false);
    });

    it("rejects a ZIP archive missing required DOCX entries", async () => {
      const buffer = createZipFixture([
        {
          name: "readme.txt",
          content: "This is not a Word document.",
        },
      ]);

      await expect(
        validateDocumentFile(buffer, docxMimeType),
      ).resolves.toBe(false);
    });

    it("rejects a DOCX archive with duplicate entry names", async () => {
      const buffer = createZipFixture([
        {
          name: "[Content_Types].xml",
          content: "<Types/>",
        },
        {
          name: "[Content_Types].xml",
          content: "<Types/>",
        },
        {
          name: "_rels/.rels",
          content: "<Relationships/>",
        },
        {
          name: "word/document.xml",
          content: "<document/>",
        },
      ]);

      await expect(
        validateDocumentFile(buffer, docxMimeType),
      ).resolves.toBe(false);
    });

    it("rejects a ZIP archive with invalid DOCX content types", async () => {
      const buffer = createZipFixture([
        {
          name: "[Content_Types].xml",
          content: "<Types/>",
        },
        {
          name: "_rels/.rels",
          content: '<Relationships><Relationship Type="officeDocument" Target="word/document.xml"/></Relationships>',
        },
        {
          name: "word/document.xml",
          content: "<document/>",
        },
      ]);

      await expect(
        validateDocumentFile(buffer, docxMimeType),
      ).resolves.toBe(false);
    });

    it("rejects a truncated ZIP archive", async () => {
      const validDocx = createValidDocxFixture();
      const truncated = validDocx.subarray(0, 20);

      await expect(
        validateDocumentFile(truncated, docxMimeType),
      ).resolves.toBe(false);
    });
  });

  describe("MIME type handling", () => {
    it("rejects unsupported MIME types", async () => {
      const buffer = Buffer.from(
        "Some content",
        "utf8",
      );

      await expect(
        validateDocumentFile(buffer, "text/plain"),
      ).resolves.toBe(false);
    });

    it("rejects a valid PDF signature declared as PNG", async () => {
      const buffer = Buffer.from(
        "%PDF-1.7\n",
        "ascii",
      );

      await expect(
        validateDocumentFile(buffer, "image/png"),
      ).resolves.toBe(false);
    });

    it("rejects buffers shorter than four bytes", async () => {
      const buffer = Buffer.from([
        0x25,
        0x50,
        0x44,
      ]);

      await expect(
        validateDocumentFile(buffer, "application/pdf"),
      ).resolves.toBe(false);
    });
  });
});