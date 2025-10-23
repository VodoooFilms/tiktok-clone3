"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { Models } from "appwrite";
import { database, storage, ID, Permission, Role, Query } from "@/libs/AppWriteClient";
import MainLayout from "@/app/layouts/MainLayout";
import { useUser } from "@/app/context/user";

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [doc, setDoc] = useState<Models.Document | null>(null);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const databaseId = process.env.NEXT_PUBLIC_DATABASE_ID as string;
  const collectionId = process.env.NEXT_PUBLIC_COLLECTION_ID_POST as string;
  const bucketId = process.env.NEXT_PUBLIC_BUCKET_ID as string | undefined;
  const likeCol = process.env.NEXT_PUBLIC_COLLECTION_ID_LIKE as string | undefined;
  const commentCol = process.env.NEXT_PUBLIC_COLLECTION_ID_COMMENT as string | undefined;
  const { user } = useUser();

  const [likeCount, setLikeCount] = useState(0);
  const [likeError, setLikeError] = useState("");
  const [likeKeys, setLikeKeys] = useState<{ userKey: string; postKey: string; idKey: string; createdAtKey: string; hasIdAttr: boolean }>(
    { userKey: "user_id", postKey: "post_id", idKey: "id", createdAtKey: "created_at", hasIdAttr: true }
  );
  const [likeDocId, setLikeDocId] = useState<string | null>(null);
  const [comments, setComments] = useState<Models.Document[]>([]);
  const [commentText, setCommentText] = useState("");
  const [postingComment, setPostingComment] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError("");
        const d = await database.getDocument(databaseId, collectionId, String(id));
        setDoc(d as any);
      } catch (e: any) {
        setError(String(e?.message || e));
      } finally {
        setLoading(false);
      }
    })();
  }, [id, databaseId, collectionId]);

  const refreshLikes = async () => {
    if (!likeCol) return;
    const postId = String(id);
    const res = await database.listDocuments(databaseId, likeCol, [
      Query.equal(likeKeys.postKey, postId),
      Query.limit(1),
    ] as any);
    setLikeCount(res.total || 0);
    if (user) {
      const mine = await database.listDocuments(databaseId, likeCol, [
        Query.equal(likeKeys.postKey, postId),
        Query.equal(likeKeys.userKey, user.$id),
        Query.limit(1),
      ] as any);
      setLikeDocId(mine.documents[0]?.$id || null);
    } else {
      setLikeDocId(null);
    }
  };

  const refreshComments = async () => {
    if (!commentCol) return;
    const postId = String(id);
    const res = await database.listDocuments(databaseId, commentCol, [
      Query.equal(likeKeys.postKey, postId),
      Query.orderDesc("created_at"),
      Query.limit(20),
    ] as any);
    setComments(res.documents);
  };

  useEffect(() => {
    refreshLikes();
    refreshComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user?.$id, likeCol, commentCol]);

  const toggleLike = async () => {
    if (!likeCol || !user) return;
    const postId = String(id);
    if (likeDocId) {
      const prev = likeDocId;
      setLikeDocId(null);
      setLikeCount((c) => Math.max(0, c - 1));
      try {
        await database.deleteDocument(databaseId, likeCol, prev);
      } catch (e) {
        setLikeDocId(prev);
        setLikeCount((c) => c + 1);
        console.error("Unlike failed", e);
      }
      return;
    }
    // Like (optimistic)
    setLikeDocId("pending");
    setLikeCount((c) => c + 1);
    const perms = [
      Permission.read(Role.any()),
      Permission.update(Role.user(user.$id)),
      Permission.delete(Role.user(user.$id)),
    ];
    try {
      const payload: any = {
        user_id: user.$id,
        post_id: postId,
        id: `${user.$id}:${postId}`.slice(0, 30),
      };
      const d = await database.createDocument(databaseId, likeCol, ID.unique(), payload, perms as any);
      setLikeDocId(d.$id);
    } catch (e: any) {
      try {
        const msg = String(e?.message || e || "");
        let payload: any = { user_id: user.$id, post_id: postId };
        const d = await database.createDocument(databaseId, likeCol, ID.unique(), payload, perms as any);
        setLikeDocId(d.$id);
      } catch (e2) {
        setLikeDocId(null);
        setLikeCount((c) => Math.max(0, c - 1));
        console.error("Like failed", e2);
      }
    }
  };

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentCol || !user) return;
    const text = commentText.trim();
    if (!text) return;
    setPostingComment(true);
    try {
      const payload: any = {
        user_id: user.$id,
        post_id: String(id),
        text,
        created_at: new Date().toISOString(),
      };
      const perms = [
        Permission.read(Role.any()),
        Permission.update(Role.user(user.$id)),
        Permission.delete(Role.user(user.$id)),
      ];
      const created = await database.createDocument(databaseId, commentCol, ID.unique(), payload, perms as any);
      setComments((prev) => [created as any, ...prev]);
      setCommentText("");
    } finally {
      setPostingComment(false);
    }
  };

  const get = (obj: any, keys: string[]) => keys.find((k) => k in obj);

  let videoSrc = "";
  let text = "";
  let caption = "";
  let createdAt = "";

  if (doc) {
    const videoUrlKey = get(doc as any, ["video_url", "videoUrl"]);
    const videoIdKey = get(doc as any, ["video_id", "videoId", "file_id", "fileId"]);
    const textKey = get(doc as any, ["text", "caption", "description"]) || "text";
    const createdKey = get(doc as any, ["created_at", "createdAt", "$createdAt"]) || "$createdAt";

    if (videoUrlKey) videoSrc = String((doc as any)[videoUrlKey]);
    else if (videoIdKey && bucketId) {
      try {
        videoSrc = storage.getFileView(String(bucketId), String((doc as any)[videoIdKey])).toString();
      } catch {}
    }
    text = String((doc as any)[textKey] ?? "");
    caption = String((doc as any).caption ?? "");
    const createdRaw = String((doc as any)[createdKey] ?? "");
    createdAt = createdRaw ? new Date(createdRaw).toLocaleString() : "";
  }

  return (
    <MainLayout>
      <section className="grid grid-cols-1 gap-6 p-4 md:grid-cols-2">
        <div className="rounded border border-neutral-800 bg-black p-2">
          {loading && <div className="p-4 text-sm text-neutral-400">Loading…</div>}
          {error && <div className="p-4 text-sm text-red-400">{error}</div>}
          {!loading && !error && (
            videoSrc ? (
              <video src={videoSrc} className="aspect-[9/16] w-full object-contain" controls />
            ) : (
              <div className="aspect-[9/16] w-full bg-neutral-900" />
            )
          )}
        </div>
        <div className="flex flex-col gap-3">
          <h1 className="text-lg font-semibold">Post</h1>
          {createdAt && <div className="text-xs text-neutral-400">{createdAt}</div>}
          {text && <p className="text-sm">{text}</p>}
          {caption && <p className="text-sm text-neutral-400">{caption}</p>}
          <div className="mt-2 flex items-center gap-3">
            <button
              onClick={toggleLike}
              className={`rounded-full border px-4 py-1 ${likeDocId ? "bg-rose-600 border-rose-600" : "border-neutral-700"}`}
            >
              ❤ Like
            </button>
            <span className="text-sm opacity-80">{likeCount} likes</span>
          </div>
          <div className="mt-4">
            <h2 className="mb-2 text-sm font-medium opacity-80">Comments</h2>
            <form onSubmit={submitComment} className="mb-3 flex gap-2">
              <input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a comment"
                className="flex-1 rounded border border-neutral-800 bg-black px-3 py-2 text-sm"
              />
              <button
                type="submit"
                disabled={postingComment || !commentText.trim()}
                className="rounded bg-emerald-600 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
              >
                {postingComment ? "Posting…" : "Post"}
              </button>
            </form>
            <div className="flex flex-col divide-y divide-neutral-800">
              {comments.map((c) => (
                <div key={c.$id} className="py-2">
                  <div className="flex items-center gap-2 text-xs opacity-60">
                    <span>{(c as any).user_id || "user"}</span>
                    <span>·</span>
                    <span>{new Date(String((c as any).created_at || c.$createdAt)).toLocaleString()}</span>
                  </div>
                  <div className="text-sm">{(c as any).text}</div>
                </div>
              ))}
              {comments.length === 0 && (
                <div className="py-6 text-center text-sm opacity-60">No comments yet</div>
              )}
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
