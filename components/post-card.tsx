"use client";
import type { Models } from "appwrite";
import { storage } from "@/libs/AppWriteClient";

type Props = { doc: Models.Document };

export default function PostCard({ doc }: Props) {
  const bucketId = process.env.NEXT_PUBLIC_BUCKET_ID as string | undefined;
  const get = (keys: string[]) => keys.find((k) => k in (doc as any));

  const videoUrlKey = get(["video_url", "videoUrl"]);
  const videoIdKey = get(["video_id", "videoId", "file_id", "fileId"]);
  const textKey = get(["text", "caption", "description"]) || "text";
  const createdKey = get(["created_at", "createdAt", "$createdAt"]) || "$createdAt";

  let videoSrc = "";
  if (videoUrlKey) {
    videoSrc = String((doc as any)[videoUrlKey]);
  } else if (videoIdKey && bucketId) {
    try {
      videoSrc = storage
        .getFileView(String(bucketId), String((doc as any)[videoIdKey]))
        .toString();
    } catch {}
  }

  const text = String((doc as any)[textKey] ?? "");
  const createdAtRaw = String((doc as any)[createdKey] ?? "");
  const createdAt = createdAtRaw ? new Date(createdAtRaw).toLocaleString() : "";

  return (
    <article className="flex gap-4 border-b p-4">
      <div className="w-44 shrink-0 overflow-hidden rounded bg-black">
        {videoSrc ? (
          <video
            src={videoSrc}
            className="h-40 w-44 object-cover"
            controls
            preload="metadata"
          />
        ) : (
          <div className="h-40 w-44 bg-neutral-200" />
        )}
      </div>
      <div className="flex flex-1 flex-col">
        <div className="mb-1 flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-neutral-200" />
          <div className="text-sm font-medium">
            {(doc as any).user_id || (doc as any).userid || "user"}
          </div>
          {createdAt && <div className="ml-auto text-xs opacity-60">{createdAt}</div>}
        </div>
        <p className="text-sm">{text || (doc as any).caption || ""}</p>
      </div>
    </article>
  );
}

