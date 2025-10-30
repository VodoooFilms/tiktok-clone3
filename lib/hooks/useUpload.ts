"use client";

const UPLOAD_ENDPOINT = "/api/uploads";

const envLimit = Number(process.env.NEXT_PUBLIC_UPLOAD_MAX_MB ?? "");
const DEFAULT_MAX_MB = Number.isFinite(envLimit) && envLimit > 0 ? envLimit : 100;
const directThresholdEnv = Number(process.env.NEXT_PUBLIC_DIRECT_UPLOAD_THRESHOLD_MB ?? "");
const DIRECT_THRESHOLD_MB = Number.isFinite(directThresholdEnv) && directThresholdEnv > 0 ? directThresholdEnv : 0;
const DIRECT_THRESHOLD_BYTES = DIRECT_THRESHOLD_MB > 0 ? DIRECT_THRESHOLD_MB * 1024 * 1024 : 0;

type UploadStrategy = "server" | "direct";

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
  strategy: UploadStrategy;
};

type DirectUploadMeta = {
  uploadUrl: string;
  headers?: Record<string, string>;
  method?: string;
  objectName: string;
  publicUrl: string;
};

async function readErrorBody(res: Response) {
  try {
    const data = await res.json();
    if (data?.error) return String(data.error);
  } catch {
    try {
      const text = await res.text();
      if (text) return text.slice(0, 200);
    } catch {}
  }
  return "";
}

export function useUpload() {
  const upload = async (file: File, opts: UploadOptions = {}): Promise<UploadResult> => {
    const {
      maxSizeMB = DEFAULT_MAX_MB,
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

    const shouldDirectUpload = DIRECT_THRESHOLD_MB > 0 && file.size > DIRECT_THRESHOLD_BYTES;

    let attempt = 0;
    while (true) {
      try {
        if (shouldDirectUpload) {
          const metaRes = await fetch(UPLOAD_ENDPOINT, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              fileName: file.name,
              contentType: file.type,
              prefix,
              size: file.size,
            }),
          });

          if (!metaRes.ok) {
            const message = await readErrorBody(metaRes);
            throw new Error(message || `Signed upload failed (${metaRes.status})`);
          }

          const meta = (await metaRes.json()) as DirectUploadMeta;
          if (!meta?.uploadUrl || !meta?.objectName || !meta?.publicUrl) {
            throw new Error("Signed upload response missing required fields");
          }

          const uploadHeaders: Record<string, string> = {
            ...(meta.headers ?? {}),
          };
          if (!uploadHeaders["Content-Type"] && file.type) {
            uploadHeaders["Content-Type"] = file.type;
          }

          const method = (meta.method || "PUT").toUpperCase();
          const uploadRes = await fetch(meta.uploadUrl, {
            method,
            headers: uploadHeaders,
            body: file,
          });

          if (!uploadRes.ok) {
            const serverMsg = await readErrorBody(uploadRes);
            throw new Error(serverMsg || `Direct upload failed (${uploadRes.status})`);
          }

          return {
            publicUrl: meta.publicUrl,
            objectName: meta.objectName,
            contentType: file.type,
            size: file.size,
            strategy: "direct",
          };
        }

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
          const message = await readErrorBody(res);
          throw new Error(message || `Upload failed (${res.status})`);
        }

        const payload = (await res.json()) as UploadResult;
        if (!payload?.publicUrl) {
          throw new Error("Upload response missing publicUrl");
        }
        return { ...payload, strategy: payload.strategy ?? "server" };
      } catch (e: any) {
        attempt++;
        const msg = String(e?.message || e || "");
        const transient = /timeout|network|fetch failed|ECONNRESET|ETIMEDOUT/i.test(msg);
        if (!transient || attempt > retries) throw e;
        await new Promise((r) => setTimeout(r, 600 * attempt));
      }
    }
  };
  return { upload };
}
