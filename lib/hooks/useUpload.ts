"use client";
import { storage } from "@/libs/AppWriteClient";

export type UploadOptions = {
  maxSizeMB?: number;
  mimeWhitelist?: string[];
  retries?: number;
};

export function useUpload() {
  const bucketId = process.env.NEXT_PUBLIC_BUCKET_ID as string;

  const upload = async (file: File, opts: UploadOptions = {}) => {
    const {
      maxSizeMB = 100,
      mimeWhitelist = ["video/mp4", "video/quicktime", "video/webm"],
      retries = 1,
    } = opts;

    if (!file) throw new Error("No file provided");
    if (file.size > maxSizeMB * 1024 * 1024) {
      throw new Error(`File exceeds ${maxSizeMB}MB limit`);
    }
    if (mimeWhitelist.length && !mimeWhitelist.includes(file.type)) {
      throw new Error("Unsupported file type");
    }

    let attempt = 0;
    // Use deterministic unique() but retries on transient errors
    while (true) {
      try {
        const res = await storage.createFile(bucketId, "unique()", file);
        return res; // contains $id, bucketId, etc.
      } catch (e: any) {
        attempt++;
        const msg = String(e?.message || e || "");
        const transient = /timeout|network|fetch failed|ECONNRESET|ETIMEDOUT/i.test(msg);
        if (!transient || attempt > retries) throw e;
        // wait a bit then retry
        await new Promise((r) => setTimeout(r, 600 * attempt));
      }
    }
  };

  const getImagePreviewURL = (fileId: string, width = 200, height = 200) => {
    return storage.getFilePreview(bucketId, fileId, width, height).toString();
  };

  const getFileViewURL = (fileId: string) => {
    return storage.getFileView(bucketId, fileId).toString();
  };

  return { upload, getImagePreviewURL, getFileViewURL };
}
