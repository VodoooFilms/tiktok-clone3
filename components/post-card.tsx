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
  const [likeBusy, setLikeBusy] = useState(false);
  const [likeError, setLikeError] = useState<string>("");

  // Detect Like schema (optional)
  const [likeKeys, setLikeKeys] = useState<{ userKey: string; postKey: string; idKey: string; hasIdAttr: boolean }>(
    { userKey: "user_id", postKey: "post_id", idKey: "id", hasIdAttr: true }
  );
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
        Query.equal(likeKeys.postKey, postId),
        Query.limit(1),
      ] as any);
      setLikeCount(res.total || 0);
      if (user) {
        const mine = await database.listDocuments(dbId, likeCol, [
          Query.equal(likeKeys.postKey, postId),
          Query.equal(likeKeys.userKey, user.$id),
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
  }, [doc.$id, dbId, likeCol, user?.$id, likeKeys.postKey, likeKeys.userKey]);

  // Try to detect Like collection attribute keys (requires APPWRITE_API_KEY on server)
  useEffect(() => {
    (async () => {
      try {
        if (!dbId || !likeCol) return;
        const url = new URL(window.location.origin + "/api/admin/collection");
        url.searchParams.set("db", String(dbId));
        url.searchParams.set("col", String(likeCol));
        const res = await fetch(url.toString(), { cache: "no-store" });
        if (!res.ok) return; // skip if unauthorized
        const json = await res.json();
        const attrs: any[] = json?.data?.attributes ?? [];
        const has = (name: string) => attrs.some((a: any) => a.key === name || a.$id === name);
        const next = { ...likeKeys };
        if (has("user_id")) next.userKey = "user_id";
        else if (has("userid")) next.userKey = "userid";
        else if (has("userId")) next.userKey = "userId";
        if (has("post_id")) next.postKey = "post_id";
        else if (has("postId")) next.postKey = "postId";
        else if (has("post")) next.postKey = "post";
        next.hasIdAttr = has("id");
        setLikeKeys(next);
      } catch {}
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dbId, likeCol]);

  const toggleLike = async () => {
    if (!dbId || !likeCol || likeBusy) return;
    if (!user) return; // could open auth overlay here
    setLikeBusy(true);
    setLikeError("");
    const postId = String((doc as any).$id);
    // Optimistic update
    if (likeDocId) {
      const prevId = likeDocId;
      setLikeDocId(null);
      setLikeCount((c) => Math.max(0, c - 1));
      try {
        await database.deleteDocument(dbId, likeCol, prevId);
      } catch (e) {
        // rollback on error
        setLikeDocId(prevId);
        setLikeCount((c) => c + 1);
        console.error("Unlike failed", e);
      }
    } else {
      const optimisticId = "optimistic:" + ID.unique();
      setLikeDocId(optimisticId);
      setLikeCount((c) => c + 1);
      try {
        const perms = [
          Permission.read(Role.any()),
          Permission.update(Role.user(user.$id)),
          Permission.delete(Role.user(user.$id)),
        ];
        const payload: any = {
          [likeKeys.userKey]: user.$id,
          [likeKeys.postKey]: postId,
        };
        if (likeKeys.hasIdAttr) (payload as any)[likeKeys.idKey] = `${user.$id}:${postId}`.slice(0, 30);
        try {
          const created = await database.createDocument(dbId, likeCol, ID.unique(), payload, perms as any);
          setLikeDocId(created.$id);
        } catch (eWithMap: any) {
          const msg = String(eWithMap?.message || eWithMap || "");
          // Unknown id attribute → drop 'id' and retry once
          if (/Unknown attribute\s+"id"/i.test(msg)) {
            delete (payload as any)[likeKeys.idKey];
            const created = await database.createDocument(dbId, likeCol, ID.unique(), payload, perms as any);
            setLikeDocId(created.$id);
          } else {
            throw eWithMap;
          }
        }
      } catch (e2: any) {
        // rollback on error
        setLikeDocId(null);
        setLikeCount((c) => Math.max(0, c - 1));
        const msg = String(e2?.message || e2 || "");
        setLikeError(msg);
        console.error("Like failed", e2);
      } finally {
        setLikeBusy(false);
      }
    }
  };

  // Play/pause on visibility
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    let fetched = false;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const v = entry.target as HTMLVideoElement;
          if (entry.isIntersecting && entry.intersectionRatio > 0.8) {
            try { v.play().catch(() => {}); } catch {}
            if (!fetched) {
              fetched = true;
              refreshLikes();
            }
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
    <article className="w-full border-b border-neutral-800 snap-start">
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
              className={`grid h-12 w-12 place-items-center rounded-full border transition-colors ${likeDocId ? "bg-rose-600 border-rose-600 text-white" : "border-neutral-700 hover:bg-neutral-900 text-neutral-200"} ${likeBusy ? "opacity-60 cursor-not-allowed" : ""}`}
              title={user ? (likeDocId ? "Unlike" : "Like") : "Log in to like"}
              disabled={likeBusy}
            >
              <span className="text-lg">{likeDocId ? "❤" : "♡"}</span>
            </button>
            <div className="text-xs opacity-80 min-w-[2ch] text-center">
              {loadingLikes ? "…" : likeCount}
            </div>
            {likeError && (
              <div className="max-w-[140px] text-center text-[10px] text-red-400">{likeError}</div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
