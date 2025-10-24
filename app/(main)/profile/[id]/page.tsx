"use client";
import MainLayout from "@/app/layouts/MainLayout";
import ProfileActions from "@/components/profile-actions";
import { useProfile } from "@/lib/hooks/useProfile";
import { useUser } from "@/app/context/user";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import type { Models } from "appwrite";
import { database, storage, Query, ID, Permission, Role } from "@/libs/AppWriteClient";

type Doc = Models.Document;

export default function ProfilePage() {
  const { id: routeId } = useParams<{ id: string }>();
  const userId = String(routeId || "");
  const { user } = useUser();
  const bucketId = process.env.NEXT_PUBLIC_BUCKET_ID as string | undefined;

  const databaseId = process.env.NEXT_PUBLIC_DATABASE_ID as string;
  const postCol = process.env.NEXT_PUBLIC_COLLECTION_ID_POST as string;
  const followCol = process.env.NEXT_PUBLIC_COLLECTION_ID_FOLLOW as string;

  const [posts, setPosts] = useState<Doc[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [followCounts, setFollowCounts] = useState<{ followers: number; following: number }>({ followers: 0, following: 0 });
  const [isFollowing, setIsFollowing] = useState<boolean>(false);
  const [followDocId, setFollowDocId] = useState<string | null>(null);
  const [busyFollow, setBusyFollow] = useState(false);

  const authorKeys = ["user_id", "userid", "userId"] as const;

  // Load profile doc (name, bio, avatar, banner)
  const { profile, refresh: refreshProfile } = useProfile(userId);

  const fetchPosts = async () => {
    setLoadingPosts(true);
    const seen = new Set<string>();
    const merged: Doc[] = [];
    for (const key of authorKeys) {
      try {
        const res = await database.listDocuments(databaseId, postCol, [
          Query.equal(key as any, String(userId)),
          Query.orderDesc("$createdAt"),
          Query.limit(25),
        ] as any);
        for (const d of res.documents) {
          if (!seen.has(d.$id)) { seen.add(d.$id); merged.push(d as any); }
        }
      } catch {
        // ignore if key not found
      }
    }
    merged.sort((a: any, b: any) => (a.$createdAt < b.$createdAt ? 1 : -1));
    setPosts(merged);
    setLoadingPosts(false);
  };

  const refreshFollows = async () => {
    if (!followCol) return;
    // Followers = who follows this user
    const followersRes = await database.listDocuments(databaseId, followCol, [
      Query.equal("following_id", String(userId)),
      Query.limit(1),
    ] as any);
    // Following = who this user follows
    const followingRes = await database.listDocuments(databaseId, followCol, [
      Query.equal("follower_id", String(userId)),
      Query.limit(1),
    ] as any);
    setFollowCounts({ followers: followersRes.total || 0, following: followingRes.total || 0 });

    // Does current user follow this profile?
    if (user) {
      const mine = await database.listDocuments(databaseId, followCol, [
        Query.equal("follower_id", user.$id),
        Query.equal("following_id", String(userId)),
        Query.limit(1),
      ] as any);
      setIsFollowing(Boolean(mine.documents[0]));
      setFollowDocId(mine.documents[0]?.$id || null);
    } else {
      setIsFollowing(false);
      setFollowDocId(null);
    }
  };

  useEffect(() => {
    fetchPosts();
    refreshFollows();
    refreshProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, user?.$id, databaseId, postCol, followCol]);

  // Refresh profile when editor saves
  useEffect(() => {
    const onSaved = () => { refreshProfile(); };
    if (typeof window !== 'undefined') window.addEventListener('profile:saved', onSaved);
    return () => { if (typeof window !== 'undefined') window.removeEventListener('profile:saved', onSaved); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleFollow = async () => {
    if (!followCol || !user || busyFollow) return;
    setBusyFollow(true);
    try {
      if (followDocId) {
        await database.deleteDocument(databaseId, followCol, followDocId);
        setIsFollowing(false);
        setFollowDocId(null);
        setFollowCounts((c) => ({ ...c, followers: Math.max(0, c.followers - 1) }));
      } else {
        const payload: any = { follower_id: user.$id, following_id: String(userId) };
        const perms = [
          Permission.read(Role.any()),
          Permission.update(Role.user(user.$id)),
          Permission.delete(Role.user(user.$id)),
        ];
        // Deterministic composite ID to avoid duplicate errors and make idempotent
        const compositeId = `f_${user.$id.slice(0,12)}_${String(userId).slice(0,12)}`;
        try {
          const created = await database.createDocument(databaseId, followCol, ID.custom(compositeId), payload, perms as any);
          setIsFollowing(true);
          setFollowDocId(created.$id);
          setFollowCounts((c) => ({ ...c, followers: c.followers + 1 }));
        } catch (e: any) {
          const msg = String(e?.message || "").toLowerCase();
          if ((e && e.code === 409) || msg.includes("already exists")) {
            setIsFollowing(true);
            setFollowDocId(compositeId);
            setFollowCounts((c) => ({ ...c, followers: c.followers + 1 }));
          } else {
            throw e;
          }
        }
      }
    } finally {
      setBusyFollow(false);
    }
  };

  return (
    <MainLayout>
      <section className="w-full p-0">
        {/* Banner */}
        <div className="relative h-40 w-full bg-neutral-900">
          {(() => {
            const any: any = profile || {};
            const bucket = process.env.NEXT_PUBLIC_BUCKET_ID as string | undefined;
            const bannerId = any.banner_file_id || any.bannerId || any.banner || any.banner_fileId || any.bannerUrl || any.banner_url;
            const url = bannerId && bucket ? storage.getFileView(String(bucket), String(bannerId)).toString() : "";
            return url ? <img src={url} alt="banner" className="h-full w-full object-cover" /> : null;
          })()}
          {/* Avatar */}
          <div className="absolute -bottom-10 left-4 h-20 w-20 overflow-hidden rounded-full border-2 border-white bg-neutral-800">
            {(() => {
              const any: any = profile || {};
              const bucket = process.env.NEXT_PUBLIC_BUCKET_ID as string | undefined;
              const avatarId = any.avatar_file_id || any.avatarId || any.avatar || any.avatar_fileId || any.avatarUrl || any.avatar_url;
              const url = avatarId && bucket ? storage.getFileView(String(bucket), String(avatarId)).toString() : "";
              return url ? <img src={url} alt="avatar" className="h-full w-full object-cover" /> : null;
            })()}
          </div>
        </div>
        <div className="px-4 pt-12">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-semibold">
                {(() => { const any: any = profile || {}; const fn = any.firstName || null; const ln = any.lastName || null; const name = [fn, ln].filter(Boolean).join(" ") || any.name || null; return name ? String(name) : (user?.$id === String(userId) ? "My profile" : `@${String(userId)}`); })()}
              </h1>
              <div className="mt-1 flex gap-4 text-sm text-neutral-400">
                <span><strong className="text-white">{followCounts.followers}</strong> followers</span>
                <span><strong className="text-white">{followCounts.following}</strong> following</span>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              {user?.$id === String(userId) ? (
                <ProfileActions />
              ) : (
                <button
                  onClick={toggleFollow}
                  disabled={busyFollow}
                  className={`rounded px-4 py-1 text-sm ${isFollowing ? "bg-neutral-800" : "bg-emerald-600"}`}
                >
                  {isFollowing ? "Following" : "Follow"}
                </button>
              )}
            </div>
          </div>
          {/* Bio */}
          {(() => { const any: any = profile || {}; const bio = any.bio || any.description; return bio ? (<p className="mt-2 text-sm text-neutral-300">{String(bio)}</p>) : null; })()}
        </div>

        {/* Posts grid */}
        <div className="mt-6 px-4">
          <h2 className="mb-2 text-sm font-medium opacity-80">Posts</h2>
          {loadingPosts && <div className="text-sm text-neutral-400">Loading...</div>}
          {!loadingPosts && posts.length === 0 && (
            <div className="text-sm text-neutral-400">No posts yet</div>
          )}
          {!loadingPosts && posts.length > 0 && (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
              {posts.map((p) => {
                const any = p as any;
                const url = any.video_url || any.videoUrl || "";
                const vid = any.video_id || any.videoId || any.file_id || any.fileId;
                const src = url || (vid && bucketId ? storage.getFileView(String(bucketId), String(vid)).toString() : "");
                return (
                  <a key={p.$id} href={`/post/${p.$id}`} className="block overflow-hidden rounded border border-neutral-800 bg-black">
                    {src ? (
                      <video src={String(src)} className="aspect-[9/16] w-full object-cover rounded-[10px]" muted playsInline loop autoPlay preload="metadata" />
                    ) : (
                      <div className="aspect-[9/16] w-full bg-neutral-900" />
                    )}
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </MainLayout>
  );
}
