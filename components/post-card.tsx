"use client";
import type { Models } from "appwrite";
import { storage, database, ID, Permission, Role, Query } from "@/libs/AppWriteClient";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useUser } from "@/app/context/user";

type Props = { doc: Models.Document };

export default function PostCard({ doc }: Props) {
  const { user } = useUser();
  const bucketId = process.env.NEXT_PUBLIC_BUCKET_ID as string | undefined;
  const dbId = process.env.NEXT_PUBLIC_DATABASE_ID as string | undefined;
  const likeCol = process.env.NEXT_PUBLIC_COLLECTION_ID_LIKE as string | undefined;
  const get = (keys: string[]) => keys.find((k) => k in (doc as any));

  const videoUrlKey = get(["video_url", "videoUrl"]);
  const videoIdKey = get(["video_id", "videoId", "file_id", "fileId"]);
  const textKey = get(["text", "caption", "description"]) || "text";
  const createdKey = get(["created_at", "createdAt", "$createdAt"]) || "$createdAt";

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoSrc, setVideoSrc] = useState<string>("");
  const [likeCount, setLikeCount] = useState<number>(0);
  const [likeDocId, setLikeDocId] = useState<string | null>(null);
  const [loadingLikes, setLoadingLikes] = useState(false);
  useEffect(() => {
    let src = "";
    if (videoUrlKey) {
      src = String((doc as any)[videoUrlKey]);
    } else if (videoIdKey && bucketId) {
      try {
        src = storage.getFileView(String(bucketId), String((doc as any)[videoIdKey])).toString();
      } catch {}
    }
    setVideoSrc(src);
  }, [bucketId, doc, storage]);

  const text = String((doc as any)[textKey] ?? "");
  const createdAtRaw = String((doc as any)[createdKey] ?? "");
  const createdAt = createdAtRaw ? new Date(createdAtRaw).toLocaleString() : "";

  // Fetch likes count and whether current user liked
  const refreshLikes = async () => {
    if (!dbId || !likeCol) return;
    setLoadingLikes(true);
    try {
      const postId = String((doc as any).$id);
      const res = await database.listDocuments(dbId, likeCol, [
        Query.equal("post_id", postId),
        Query.limit(1),
      ] as any);
      setLikeCount(res.total || 0);
      if (user) {
        const mine = await database.listDocuments(dbId, likeCol, [
          Query.equal("post_id", postId),
          Query.equal("user_id", user.$id),
          Query.limit(1),
        ] as any);
        setLikeDocId(mine.documents[0]?.$id || null);
      } else {
        setLikeDocId(null);
      }
    } finally {
      setLoadingLikes(false);
    }
  };

  useEffect(() => {
    refreshLikes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc.$id, dbId, likeCol, user?.$id]);

  const toggleLike = async () => {
    if (!dbId || !likeCol) return;
    if (!user) return; // could open auth overlay here
    const postId = String((doc as any).$id);
    if (likeDocId) {
      try {
        await database.deleteDocument(dbId, likeCol, likeDocId);
        setLikeDocId(null);
        setLikeCount((c) => Math.max(0, c - 1));
      } catch {}
    } else {
      try {
        const newId = ID.unique();
        const payload: any = {
          user_id: user.$id,
          post_id: postId,
          created_at: new Date().toISOString(),
        };
        const perms = [
          Permission.read(Role.any()),
          Permission.update(Role.user(user.$id)),
          Permission.delete(Role.user(user.$id)),
        ];
        const created = await database.createDocument(dbId, likeCol, newId, payload, perms as any);
        setLikeDocId(created.$id);
        setLikeCount((c) => c + 1);
      } catch {}
    }
  };

  // Play/pause on visibility
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const v = entry.target as HTMLVideoElement;
          if (entry.isIntersecting && entry.intersectionRatio > 0.8) {
            try { v.play().catch(() => {}); } catch {}
          } else {
            try { v.pause(); } catch {}
          }
        });
      },
      { threshold: [0, 0.5, 0.8, 1] }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [videoSrc]);

  return (
    <article className="w-full border-b border-neutral-800">
      <div className="mx-auto flex w-full max-w-[680px] flex-col gap-2 px-0 md:px-4">
        <Link href={`/post/${doc.$id}`} className="block">
          <div className="relative w-full bg-black md:rounded-lg overflow-hidden">
            {videoSrc ? (
              <video
                ref={videoRef}
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
          <div className="ml-auto flex shrink-0 flex-col items-center gap-2">
            <button
              onClick={toggleLike}
              className={`grid h-12 w-12 place-items-center rounded-full border ${likeDocId ? "bg-rose-600 border-rose-600" : "border-neutral-700 hover:bg-neutral-900"}`}
              title={user ? (likeDocId ? "Unlike" : "Like") : "Log in to like"}
            >
              <span className="text-sm">❤</span>
            </button>
            <div className="text-xs opacity-80 min-w-[2ch] text-center">
              {loadingLikes ? "…" : likeCount}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
