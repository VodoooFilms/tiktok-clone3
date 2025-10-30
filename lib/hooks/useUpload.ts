"use client";
const UPLOAD_ENDPOINT = "/api/uploads";

export type UploadOptions = {
  maxSizeMB?: number;
  mimeWhitelist?: string[];
  retries?: number;
  prefix?: string;
};

export type UploadResult = {
  publicUrl: string;
  objectName: string;
  contentType?: string;
  size: number;
};

export function useUpload() {
  const upload = async (file: File, opts: UploadOptions = {}): Promise<UploadResult> => {
    const {
      maxSizeMB = 100,
      mimeWhitelist = ["video/mp4", "video/quicktime", "video/webm"],
      retries = 1,
      prefix,
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
        const formData = new FormData();
        formData.append("file", file);
        if (prefix) {
          formData.append("prefix", prefix);
        }

        const res = await fetch(UPLOAD_ENDPOINT, {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          const message = data?.error ? String(data.error) : `Upload failed (${res.status})`;
          throw new Error(message);
        }

        const payload = (await res.json()) as UploadResult;
        if (!payload?.publicUrl) {
          throw new Error("Upload response missing publicUrl");
        }
        return payload;
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
  return { upload };
}
