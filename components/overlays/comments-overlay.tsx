"use client";
import { useEffect, useMemo, useState } from "react";
import { useUI } from "@/app/context/ui-context";
import { useUser } from "@/app/context/user";
import type { Models } from "appwrite";
import { database, ID, Permission, Role, Query } from "@/libs/AppWriteClient";

export default function CommentsOverlay() {
  const { commentsPostId, closeComments } = useUI();
  const { user } = useUser();
  const [comments, setComments] = useState<Models.Document[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);

  const databaseId = process.env.NEXT_PUBLIC_DATABASE_ID as string | undefined;
  const commentCol = process.env.NEXT_PUBLIC_COLLECTION_ID_COMMENT as string | undefined;
  const commentLikeCol = process.env.NEXT_PUBLIC_COLLECTION_ID_COMMENT_LIKE as string | undefined;
  const likeKeys = useMemo(() => ({ userKey: "user_id", commentKey: "comment_id" }), []);

  const open = Boolean(commentsPostId);

  const fetchComments = async () => {
    if (!open || !databaseId || !commentCol || !commentsPostId) return;
    setLoading(true);
    setError("");
    try {
      const res = await database.listDocuments(databaseId, commentCol, [
        Query.equal("post_id", String(commentsPostId)),
        Query.orderDesc("created_at"),
        Query.limit(50),
      ] as any);
      const docs = res.documents as any;
      setComments(docs);
      setTotal(res.total || docs.length);
      if (commentLikeCol) {
        const counts: Record<string, number> = {};
        const mine: Record<string, string | null> = {};
        await Promise.all(
          docs.map(async (d: any) => {
            const cid = String(d.$id);
            try {
              const totalRes = await database.listDocuments(String(databaseId), String(commentLikeCol), [
                Query.equal(likeKeys.commentKey as any, cid),
                Query.limit(1),
              ] as any);
              counts[cid] = totalRes.total || 0;
              if (user) {
                const myRes = await database.listDocuments(String(databaseId), String(commentLikeCol), [
                  Query.equal(likeKeys.commentKey as any, cid),
                  Query.equal(likeKeys.userKey as any, user.$id),
                  Query.limit(1),
                ] as any);
                mine[cid] = myRes.documents[0]?.$id || null;
              } else {
                mine[cid] = null;
              }
            } catch {}
          })
        );
        setCommentLikeCounts(counts);
        setCommentLikeMine(mine);
      }
    } catch (e: any) {
      setError(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commentsPostId, databaseId, commentCol]);

  const [commentLikeCounts, setCommentLikeCounts] = useState<Record<string, number>>({});
  const [commentLikeMine, setCommentLikeMine] = useState<Record<string, string | null>>({});
  const [commentLikeBusy, setCommentLikeBusy] = useState<Record<string, boolean>>({});

  const toggleCommentLike = async (commentId: string) => {
    if (!databaseId || !commentLikeCol) return;
    setCommentLikeBusy((prev) => ({ ...prev, [commentId]: true }));
    const mineId = commentLikeMine[commentId];
    if (mineId) {
      try {
        setCommentLikeMine((prev) => ({ ...prev, [commentId]: null }));
        setCommentLikeCounts((prev) => ({ ...prev, [commentId]: Math.max(0, (prev[commentId] || 1) - 1) }));
        await database.deleteDocument(String(databaseId), String(commentLikeCol), mineId);
      } catch (e) {
        setCommentLikeMine((prev) => ({ ...prev, [commentId]: mineId }));
        setCommentLikeCounts((prev) => ({ ...prev, [commentId]: (prev[commentId] || 0) + 1 }));
        console.error("Unlike comment failed", e);
      } finally {
        setCommentLikeBusy((prev) => ({ ...prev, [commentId]: false }));
      }
      return;
    }
    const perms = [
      Permission.read(Role.any()),
      Permission.update(Role.user(String(user?.$id || ""))),
      Permission.delete(Role.user(String(user?.$id || ""))),
    ];
    try {
      const payload: any = {
        [likeKeys.userKey]: user?.$id,
        [likeKeys.commentKey]: commentId,
      };
      const compositeId = `clk_${String(user?.$id || "").slice(0,12)}_${String(commentId).slice(0,12)}`;
      const created = await database.createDocument(String(databaseId), String(commentLikeCol), ID.custom(compositeId), payload, perms as any);
      setCommentLikeMine((prev) => ({ ...prev, [commentId]: created.$id }));
      setCommentLikeCounts((prev) => ({ ...prev, [commentId]: (prev[commentId] || 0) + 1 }));
    } catch (e: any) {
      const msg = String(e?.message || e || "").toLowerCase();
      if (e?.code === 409 || msg.includes("already exists")) {
        setCommentLikeMine((prev) => ({ ...prev, [commentId]: `clk_${String(user?.$id || "").slice(0,12)}_${String(commentId).slice(0,12)}` }));
        setCommentLikeCounts((prev) => ({ ...prev, [commentId]: (prev[commentId] || 0) + 1 }));
      } else {
        console.error("Like comment failed", e);
      }
    } finally {
      setCommentLikeBusy((prev) => ({ ...prev, [commentId]: false }));
    }
  };

  // Close with ESC for accessibility
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeComments();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, closeComments]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !databaseId || !commentCol || !commentsPostId) return;
    const value = text.trim();
    if (!value) return;
    setPosting(true);
    try {
      const payload: any = {
        user_id: user.$id,
        post_id: String(commentsPostId),
        text: value,
        created_at: new Date().toISOString(),
      };
      const perms = [
        Permission.read(Role.any()),
        Permission.update(Role.user(user.$id)),
        Permission.delete(Role.user(user.$id)),
      ];
      const created = await database.createDocument(databaseId, commentCol, ID.unique(), payload, perms as any);
      setComments((prev) => [created as any, ...prev]);
      setTotal((t) => t + 1);
      setText("");
    } finally {
      setPosting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex justify-end">
      {/* Backdrop for clicks to close on desktop */}
      <div className="pointer-events-auto hidden flex-1 bg-black/30 md:block" onClick={closeComments} />
      <aside
        className="pointer-events-auto flex h-full w-full md:max-w-[420px] flex-col border-l border-neutral-800 bg-neutral-950 text-white"
        role="dialog"
        aria-label="Comments"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-neutral-800 px-4 py-3 bg-neutral-950/80 backdrop-blur supports-[backdrop-filter]:bg-neutral-950/60">
          <div className="text-sm font-medium">Comments{typeof total === "number" ? ` (${total})` : ""}</div>
          <button onClick={closeComments} aria-label="Close comments" className="rounded px-2 py-1 text-base md:text-sm opacity-80 hover:opacity-100">✕</button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">
          {loading && <div className="py-6 text-center text-sm text-neutral-400">Loading...</div>}
          {error && <div className="py-6 text-center text-sm text-red-400">{error}</div>}
          {!loading && !error && comments.length === 0 && (
            <div className="py-6 text-center text-sm text-neutral-400">No comments yet</div>
          )}
          <div className="flex flex-col gap-3">
            {comments.map((c) => {
              const cid = String(c.$id);
              const liked = Boolean(commentLikeMine[cid]);
              const cnt = commentLikeCounts[cid] || 0;
              const busy = !!commentLikeBusy[cid];
              return (
                <div key={cid} className="flex gap-3">
                  <div className="h-9 w-9 shrink-0 rounded-full bg-neutral-800" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-xs text-neutral-400">
                      <span className="truncate">{(c as any).user_id || "user"}</span>
                      <span>•</span>
                      <span>{new Date(String((c as any).created_at || c.$createdAt)).toLocaleString()}</span>
                    </div>
                    <div className="mt-0.5 text-sm leading-relaxed text-neutral-100 break-words">{(c as any).text}</div>
                  </div>
                  {commentLikeCol && (
                    <div className="ml-auto flex shrink-0 items-center gap-1">
                      <button
                        onClick={() => toggleCommentLike(cid)}
                        disabled={!user || busy}
                        className={`grid h-9 w-9 md:h-7 md:w-7 place-items-center rounded-full border text-xs ${liked ? "bg-rose-600 border-rose-600 text-white" : "border-neutral-700 hover:bg-neutral-900 text-neutral-200"} ${busy ? "opacity-60 cursor-not-allowed" : ""}`}
                        title={!user ? "Log in to like" : liked ? "Unlike" : "Like"}
                        aria-label={!user ? "Log in to like comment" : liked ? "Unlike comment" : "Like comment"}
                      >
                        <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" className="fill-current"><path d="M12.1 8.64l-.1.1-.11-.11C10.14 6.9 7.4 6.9 5.64 8.66c-1.76 1.76-1.76 4.6 0 6.36L12 21.36l6.36-6.34c1.76-1.76 1.76-4.6 0-6.36-1.76-1.76-4.6-1.76-6.26-.02z"/></svg>
                      </button>
                      <span className="min-w-[2ch] text-right text-xs opacity-80">{cnt}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <form onSubmit={submit} className="sticky bottom-0 z-10 flex items-center gap-2 border-t border-neutral-800 p-3 bg-neutral-950/80 backdrop-blur supports-[backdrop-filter]:bg-neutral-950/60" style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0.75rem)" }}>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={user ? "Add a comment" : "Log in to comment"}
            disabled={!user}
            className="flex-1 rounded-lg border border-neutral-800 bg-black/60 px-3 py-3 text-base md:py-2 md:text-sm disabled:opacity-60"
            aria-label="Comment text"
          />
          <button
            type="submit"
            disabled={!user || !text.trim() || posting}
            className="rounded-lg bg-emerald-600 px-4 py-3 text-base md:text-sm md:py-2 disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Post comment"
          >\n            {posting ? "Posting�" : "Post"}\n          </button>
        </form>
      </aside>

      {/* Mobile-visible floating close button */}
      <button
        onClick={closeComments}
        aria-label="Close comments"
        className="pointer-events-auto md:hidden absolute top-3 right-3 grid h-9 w-9 place-items-center rounded-full bg-black/70 text-white border border-white/20"
      >
        ✕
      </button>
    </div>
  );
}









