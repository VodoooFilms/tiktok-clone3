"use client";
import { storage } from "@/libs/AppWriteClient";

export function useUpload() {
  const bucketId = process.env.NEXT_PUBLIC_BUCKET_ID as string;

  const upload = async (file: File) => {
    const res = await storage.createFile(bucketId, "unique()", file);
    return res; // contains $id, bucketId, etc.
  };

  const getImagePreviewURL = (fileId: string, width = 200, height = 200) => {
    return storage.getFilePreview(bucketId, fileId, width, height).toString();
  };

  const getFileViewURL = (fileId: string) => {
    return storage.getFileView(bucketId, fileId).toString();
  };

  return { upload, getImagePreviewURL, getFileViewURL };
}

