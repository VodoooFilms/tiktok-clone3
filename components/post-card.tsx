"use client";
import type { Models } from "appwrite";
import { storage } from "@/libs/AppWriteClient";
import Link from "next/link";

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
    <article className="w-full border-b border-neutral-800">
      <div className="mx-auto flex w-full max-w-[680px] flex-col gap-2 px-0 md:px-4">
        <Link href={`/post/${doc.$id}`} className="block">
          <div className="relative w-full bg-black md:rounded-lg overflow-hidden">
            {videoSrc ? (
              <video
                src={videoSrc}
                className="h-[calc(100vh-56px)] w-full object-cover md:h-[720px]"
                muted
                playsInline
                loop
                autoPlay
                controls={false}
                preload="metadata"
              />
            ) : (
              <div className="h-[calc(100vh-56px)] w-full bg-neutral-900 md:h-[720px]" />
            )}
          </div>
        </Link>
        <div className="mx-4 mb-4 flex items-start gap-3 md:mx-0">
          <div className="h-10 w-10 shrink-0 rounded-full bg-neutral-800" />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <div className="text-sm font-medium">
                {(doc as any).user_id || (doc as any).userid || "user"}
              </div>
              {createdAt && <div className="text-xs opacity-60">{createdAt}</div>}
            </div>
            {(text || (doc as any).caption) && (
              <p className="mt-1 text-sm text-neutral-200">
                {text || (doc as any).caption}
              </p>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
