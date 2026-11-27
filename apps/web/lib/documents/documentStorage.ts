
import {
  BlobNotFoundError,
  head,
  del,
} from "@vercel/blob";

export type DocumentBlobMetadata = {
  pathname: string;
  size: number;
  contentType: string;
  etag: string;
};

/**
 * Inspects a private document blob without downloading its contents.
 */
export async function inspectDocumentBlob(
  pathname: string,
): Promise<DocumentBlobMetadata | null> {
  try {
    const blob = await head(pathname);

    if (
      blob.pathname !== pathname ||
      !Number.isSafeInteger(blob.size) ||
      blob.size < 0 ||
      !blob.etag
    ) {
      throw new Error("Invalid document blob metadata.");
    }

    return {
      pathname: blob.pathname,
      size: blob.size,
      contentType: blob.contentType,
      etag: blob.etag,
    };
  } catch (error) {
    if (error instanceof BlobNotFoundError) {
      return null;
    }

    throw error;
  }
}

/**
 * Deletes a document blob only if its ETag has not changed
 * since it was inspected.
 */
export async function deleteDocumentBlob(
  pathname: string,
  etag: string,
): Promise<void> {
  if (!pathname || !etag) {
    throw new Error("Document pathname and ETag are required.");
  }

  await del(pathname, {
    ifMatch: etag,
  });
}
