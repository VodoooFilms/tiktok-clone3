"use client";
import type { Models } from "appwrite";
import { storage, database, ID, Permission, Role, Query, client } from "@/libs/AppWriteClient";
import Link from "next/link";
import { IconHome, IconUsers, IconProfile, IconPlus, IconVolumeOn, IconVolumeOff } from "@/components/icons";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useUser } from "@/app/context/user";
import { useUI } from "@/app/context/ui-context";
import { useProfile } from "@/lib/hooks/useProfile";

type Props = { doc: Models.Document };

export default function PostCard({ doc }: Props) {
  const { user } = useUser();
  const router = useRouter();
  const { openComments, openAuth, commentsPostId, closeComments } = useUI();
  const pathname = usePathname();
  const bucketId = process.env.NEXT_PUBLIC_BUCKET_ID as string | undefined;
  const dbId = process.env.NEXT_PUBLIC_DATABASE_ID as string | undefined;
  const likeCol = process.env.NEXT_PUBLIC_COLLECTION_ID_LIKE as string | undefined;
  const followCol = process.env.NEXT_PUBLIC_COLLECTION_ID_FOLLOW as string | undefined;
  const get = (keys: string[]) => keys.find((k) => k in (doc as any));

  const videoUrlKey = get(["video_url", "videoUrl"]);
  const videoIdKey = get(["video_id", "videoId", "file_id", "fileId"]);
  const textKey = get(["text", "caption", "description"]) || "text";
  const createdKey = get(["created_at", "createdAt", "$createdAt"]) || "$createdAt";

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoSrc, setVideoSrc] = useState<string>("");
  const [muted, setMuted] = useState<boolean>(true);
  const [prefMuted, setPrefMuted] = useState<boolean>(false);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [likeCount, setLikeCount] = useState<number>(0);
  const [likeDocId, setLikeDocId] = useState<string | null>(null);
  const [loadingLikes, setLoadingLikes] = useState(false);
  const [likeBusy, setLikeBusy] = useState(false);
  const [likeError, setLikeError] = useState<string>("");
  const [isFollowing, setIsFollowing] = useState<boolean>(false);
  const [followDocId, setFollowDocId] = useState<string | null>(null);
  const [followBusy, setFollowBusy] = useState(false);
  const [followFlash, setFollowFlash] = useState(false);

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

  // Load preferred mute state (default muted)
  useEffect(() => {
    try {
      const saved = typeof window !== 'undefined' ? window.localStorage.getItem('ytk_pref_muted') : null;
      if (saved !== null) setPrefMuted(saved === '1');
      else setPrefMuted(true);
    } catch {}
  }, []);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    try { el.muted = muted; } catch {}
  }, [muted]);

  // React to active video changes: only the active video can use preferred mute
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (isActive) {
      setMuted(prefMuted);
      try { el.play?.(); } catch {}
    } else {
      try { el.pause?.(); } catch {}
      setMuted(true);
    }
  }, [isActive, prefMuted]);

  // Global coordination: ensure only one video is active at a time
  useEffect(() => {
    const onActive = (e: any) => {
      const activeId = String(e?.detail || "");
      const myId = String((doc as any).$id);
      setIsActive(activeId === myId);
      if (activeId !== myId) {
        try { videoRef.current?.pause?.(); } catch {}
        setMuted(true);
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('app:activeVideo', onActive as EventListener);
    }
    return () => { if (typeof window !== 'undefined') window.removeEventListener('app:activeVideo', onActive as EventListener); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const text = String((doc as any)[textKey] ?? "");
  const createdAtRaw = String((doc as any)[createdKey] ?? "");
  const createdAt = createdAtRaw ? new Date(createdAtRaw).toLocaleString() : "";

  const authorKey = get(["user_id", "userid", "userId", "author_id", "authorId", "owner_id", "ownerId", "user", "author", "uid"]);
  const authorId: string | null = authorKey && (doc as any)[authorKey] ? String((doc as any)[authorKey]) : null;

  // Load author's profile to show avatar in feeds
  const { profile: authorProfile } = useProfile(authorId || undefined);
  const authorAvatarUrl = useMemo(() => {
    if (!authorProfile || !bucketId) return "";
    const any: any = authorProfile;
    const avatarId = any.avatar_file_id || any.avatarId || any.avatar || any.avatar_fileId || any.avatarUrl || any.avatar_url;
    try {
      return avatarId ? storage.getFileView(String(bucketId), String(avatarId)).toString() : "";
    } catch {
      return "";
    }
  }, [authorProfile, bucketId, storage]);

  const refreshFollow = async () => {
    if (!dbId || !followCol || !user || !authorId || user.$id === authorId) {
      setIsFollowing(false);
      setFollowDocId(null);
      return;
    }
    try {
      const res = await database.listDocuments(dbId, followCol, [
        Query.equal("follower_id", user.$id),
        Query.equal("following_id", String(authorId)),
        Query.limit(1),
      ] as any);
      const found = res.documents[0];
      setIsFollowing(Boolean(found));
      setFollowDocId(found?.$id || null);
    } catch {
      setIsFollowing(false);
      setFollowDocId(null);
    }
  };

  useEffect(() => {
    refreshFollow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.$id, dbId, followCol, authorId]);

  const toggleFollowAuthor = async () => {
    if (!authorId || user?.$id === authorId) return;
    if (!user) { openAuth(); return; }
    if (!dbId || !followCol || followBusy) return;
    setFollowBusy(true);
    try {
      if (followDocId) {
        await database.deleteDocument(dbId, followCol, followDocId);
        setIsFollowing(false);
        setFollowDocId(null);
      } else {
        const payload: any = { follower_id: user.$id, following_id: String(authorId) };
        const perms = [
          Permission.read(Role.any()),
          Permission.update(Role.user(user.$id)),
          Permission.delete(Role.user(user.$id)),
        ];
        // Deterministic composite ID ensures idempotency even if reads are restricted
        const compositeId = `f_${user.$id.slice(0,12)}_${String(authorId).slice(0,12)}`;
        try {
          const created = await database.createDocument(dbId, followCol, ID.custom(compositeId), payload, perms as any);
          setIsFollowing(true);
          setFollowDocId(created.$id);
          setFollowFlash(true);
          setTimeout(() => setFollowFlash(false), 900);
        } catch (e: any) {
          // If document already exists, treat it as followed and store known ID for future delete
          const msg = String(e?.message || "").toLowerCase();
          if ((e && e.code === 409) || msg.includes("already exists")) {
            setIsFollowing(true);
            setFollowDocId(compositeId);
            setFollowFlash(true);
            setTimeout(() => setFollowFlash(false), 900);
          } else {
            throw e;
          }
        }
      }
    } finally {
      setFollowBusy(false);
    }
  };

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
        if (process.env.NODE_ENV === 'production') return;
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
      } finally {
        setLikeBusy(false);
      }
    } else {
      const compositeId = `lk_${String(user.$id).slice(0,12)}_${postId.slice(0,12)}`;
      const optimisticId = compositeId;
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
          const created = await database.createDocument(dbId, likeCol, ID.custom(compositeId), payload, perms as any);
          setLikeDocId(created.$id);
        } catch (eWithMap: any) {
          const msg = String(eWithMap?.message || eWithMap || "");
          if ((eWithMap && eWithMap.code === 409) || /already exists/i.test(msg)) {
            setLikeDocId(compositeId);
          }
          // Unknown id attribute → drop 'id' and retry once
          if (/Unknown attribute\s+"id"/i.test(msg)) {
            delete (payload as any)[likeKeys.idKey];
            const created = await database.createDocument(dbId, likeCol, ID.custom(compositeId), payload, perms as any);
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
      }
      setLikeBusy(false);
    }
  };

  // Realtime like count updates (ignore own optimistic actions to avoid double count)
  useEffect(() => {
    if (!dbId || !likeCol) return;
    const postId = String((doc as any).$id);
    const unsubscribe = client.subscribe(`databases.${dbId}.collections.${likeCol}.documents`, (event: any) => {
      try {
        const events: string[] = event?.events || [];
        const isCreate = events.some((e) => e.endsWith('.create'));
        const isDelete = events.some((e) => e.endsWith('.delete'));
        if (!isCreate && !isDelete) return;
        const payload: any = event?.payload || {};
        const keys = [likeKeys.postKey, 'post_id', 'postId', 'post'];
        const payloadPostId = keys.map((k) => payload?.[k]).find(Boolean);
        // Ignore events generated by the current user to prevent double increment/decrement
        const actorKeys = [likeKeys.userKey, 'user_id', 'userid', 'userId'];
        const actorId = actorKeys.map((k) => payload?.[k]).find(Boolean);
        if (actorId && user?.$id && String(actorId) === String(user.$id)) return;
        if (!payloadPostId) return;
        if (String(payloadPostId) !== postId) return;
        setLikeCount((c) => Math.max(0, c + (isCreate ? 1 : -1)));
      } catch {}
    });
    return () => { try { unsubscribe(); } catch {} };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dbId, likeCol, doc.$id, likeKeys.postKey, likeKeys.userKey, user?.$id]);

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
            try { if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('app:activeVideo', { detail: String((doc as any).$id) })); } catch {}
            setIsActive(true);
            if (!fetched) {
              fetched = true;
              refreshLikes();
            }
          } else {
            try { v.pause(); } catch {}
            setIsActive(false);
            // Close comments if this post's comments are open and user scrolled away
            try {
              const currentPostId = String((doc as any).$id);
              if (commentsPostId && commentsPostId === currentPostId) {
                closeComments();
              }
            } catch {}
          }
        });
      },
      { threshold: [0, 0.5, 0.8, 1] }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [videoSrc, commentsPostId, closeComments, doc.$id]);

  return (
    <article className="w-full snap-start">
      <div className="mx-auto md:ml-[80px] flex w-full max-w-[680px] flex-col gap-2 px-0 md:px-4" style={{ maxWidth: "calc((100vh - 56px - 15px) * 9 / 16)" }}>
        <div
          className="relative w-full bg-black md:rounded-lg overflow-hidden"
          style={{ height: "calc(100vh - 56px - 15px)" }}
        >
          {/* Top-left author avatar (moved from right rail to differentiate) */}
          <div className="pointer-events-auto absolute top-2 left-2 z-10">
            <div className="relative">
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); const uid = authorId || ""; if (uid) router.push(`/profile/${uid}`); }}
                className="block"
                title="Author"
                aria-label="View author profile"
              >
                <img src={authorAvatarUrl || "/images/placeholder-user.jpg"} alt="avatar" className={`h-12 w-12 rounded-full object-cover ${isFollowing ? "ring-2 ring-emerald-500" : "border-2 border-white/70"} ${followFlash ? "animate-pulse" : ""}`} />
              </button>
              {authorId && user?.$id !== authorId && (
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFollowAuthor(); }}
                  aria-label={isFollowing ? "Unfollow" : "Follow"}
                  className={`absolute -bottom-1 left-1/2 -translate-x-1/2 grid place-items-center rounded-full ${isFollowing ? "bg-emerald-600" : "bg-neutral-500"} text-white h-5 w-5 shadow`}
                  disabled={followBusy}
                  title={isFollowing ? "Following" : "Follow"}
                >
                  {isFollowing ? (
                    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path fill="currentColor" d="M9 16.2l-3.5-3.5-1.4 1.4L9 19 20 8l-1.4-1.4z"/></svg>
                  ) : (
                    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path fill="currentColor" d="M12 4l6 6h-4v6h-4v-6H6z"/></svg>
                  )}
                </button>
              )}
            </div>
          </div>
          <Link href={`/post/${doc.$id}`} className="block" aria-label="Open post">
            {videoSrc ? (
              <video
                ref={videoRef}
                src={videoSrc}
                className="h-full w-full object-cover rounded-[10px]"
                muted={muted}
                playsInline
                loop
                autoPlay
                controls={false}
                preload="metadata"
              />
            ) : (
              <div className="h-full w-full bg-neutral-900" />
            )}
          </Link>

            {/* Desktop mute/unmute button */}
            <div className="hidden md:block pointer-events-none absolute left-3 bottom-3 z-10">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const next = !muted;
                  try { if (typeof window !== 'undefined') window.localStorage.setItem('ytk_pref_muted', next ? '1' : '0'); } catch {}
                  setPrefMuted(next);
                  setMuted(next);
                  if (!next) { try { videoRef.current?.play?.(); } catch {} }
                }}
                className="pointer-events-auto grid h-9 w-9 place-items-center rounded-full border border-neutral-700 bg-black/60 text-white hover:bg-black/80"
                title={muted ? "Unmute" : "Mute"}
                aria-label={muted ? "Unmute video" : "Mute video"}
              >
                {muted ? <IconVolumeOff className="h-5 w-5" /> : <IconVolumeOn className="h-5 w-5" />}
              </button>
            </div>


            {/* Left action rail overlay (moved from right to left) */}
            <div className="pointer-events-auto absolute inset-y-0 left-2 flex flex-col items-center justify-center gap-3">
              {/* Like */}
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleLike(); }}
                className={`grid h-12 w-12 place-items-center rounded-full border transition-colors ${likeDocId ? "bg-rose-600 border-rose-600 text-white" : "border-neutral-700 hover:bg-neutral-900 text-neutral-200"} ${likeBusy ? "opacity-60 cursor-not-allowed" : ""}`}
                title={user ? (likeDocId ? "Unlike" : "Like") : "Log in to like"}
                disabled={likeBusy}
                aria-label={user ? (likeDocId ? "Unlike post" : "Like post") : "Log in to like"}
              >
                <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" className="fill-current"><path d="M12.1 8.64l-.1.1-.11-.11C10.14 6.9 7.4 6.9 5.64 8.66c-1.76 1.76-1.76 4.6 0 6.36L12 21.36l6.36-6.34c1.76-1.76 1.76-4.6 0-6.36-1.76-1.76-4.6-1.76-6.26-.02z"/></svg>
              </button>
              <div className="text-xs opacity-80 min-w-[2ch] text-center text-white drop-shadow">{loadingLikes ? "..." : likeCount}</div>
              {/* Comments navigates to detail */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  openComments(String((doc as any).$id));
                }}
                title="Comments"
                className="grid h-12 w-12 place-items-center rounded-full border border-neutral-700 hover:bg-neutral-900 text-neutral-200"
                aria-label="Open comments"
              >
                <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" className="fill-current"><path d="M20 2H4a2 2 0 00-2 2v14l4-4h14a2 2 0 002-2V4a2 2 0 00-2-2z"/></svg>
              </button>
              {/* Share */}
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/post/${(doc as any).$id}` : ''; (async () => { try { if (navigator.share) await navigator.share({ url: shareUrl }); else if (navigator.clipboard) await navigator.clipboard.writeText(shareUrl); } catch {} })(); }}
                className="grid h-12 w-12 place-items-center rounded-full border border-neutral-700 hover:bg-neutral-900 text-neutral-200"
                title="Share"
                aria-label="Share post"
              >
                <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" className="fill-current"><path d="M14 9V5l7 7-7 7v-4H6v-6z"/></svg>
              </button>
            </div>

            {/* Bottom mobile nav (matches left menu icons) */}
            <div className="md:hidden pointer-events-none absolute inset-x-0 bottom-0 pb-2">
              <div className="pointer-events-auto mx-auto flex max-w-[520px] items-center justify-around gap-2 rounded-2xl bg-black/40 px-3 py-2 backdrop-blur-sm">
                <Link href="/" aria-label="For You" title="For You" className={`p-2 rounded ${pathname === '/' ? 'bg-white/20' : 'hover:bg-white/10 active:bg-white/20'}`}>
                  <IconHome className="h-6 w-6 text-white" />
                </Link>
                <Link href="/following" aria-label="Following" title="Following" className={`p-2 rounded ${pathname?.startsWith('/following') ? 'bg-white/20' : 'hover:bg-white/10 active:bg-white/20'}`}>
                  <IconUsers className="h-6 w-6 text-white" />
                </Link>
                <Link href="/profile" aria-label="My Profile" title="My Profile" className={`p-2 rounded ${pathname?.startsWith('/profile') ? 'bg-white/20' : 'hover:bg-white/10 active:bg-white/20'}`}>
                  <IconProfile className="h-6 w-6 text-white" />
                </Link>
                <Link href="/upload" aria-label="Upload" title="Upload" className={`p-2 rounded ${pathname?.startsWith('/upload') ? 'bg-white/20' : 'hover:bg-white/10 active:bg-white/20'}`}>
                  <IconPlus className="h-6 w-6 text-white" />
                </Link>
              </div>
            </div>
          </div>
        {false && (
        <div className="mx-4 mb-4 flex items-start gap-3 md:mx-0">
          <div className="h-10 w-10 shrink-0 rounded-full bg-neutral-800" />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <div className="text-sm font-medium">
                {authorId ? (
                  <Link href={`/profile/${authorId}`} className="hover:underline">
                    {authorId}
                  </Link>
                ) : (
                  (doc as any).user_id || (doc as any).userid || "user"
                )}
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
        )}
      </div>
    </article>
  );
}





