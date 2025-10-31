import type { Models } from "appwrite";

const URL_RE = /^(https?:\/\/|blob:|data:video\/)/i;
const VIDEO_EXT_RE = /\.(mp4|webm|mov|m4v|m3u8)(\?.*)?$/i;

function firstKey(obj: any, keys: string[]): string | undefined {
  if (!obj || (typeof obj !== "object" && typeof obj !== "function")) return undefined;
  for (const k of keys) {
    if (k in obj) return k;
  }
  return undefined;
}

export function isPlayablePost(doc: Models.Document): boolean {
  const any: any = doc as any;
  const urlKey = firstKey(any, ["video_url", "videoUrl"]);
  if (urlKey) {
    const v = any[urlKey];
    if (typeof v === "string" && v.trim().length > 0) {
      const s = v.trim();
      if (URL_RE.test(s) || VIDEO_EXT_RE.test(s)) return true;
    }
  }

  // If it looks like a file ID and we have a bucket configured, we can resolve to a URL in the card component
  const idKey = firstKey(any, ["video_id", "videoId", "file_id", "fileId"]);
  if (idKey) {
    const raw = any[idKey];
    if (typeof raw === "string" && raw.trim().length > 0) {
      const bucketId = process.env.NEXT_PUBLIC_BUCKET_ID as string | undefined;
      if (bucketId && bucketId.trim().length > 0) return true;
    }
  }

  return false;
}

