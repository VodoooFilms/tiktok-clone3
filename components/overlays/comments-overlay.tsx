"use client";
import { useEffect, useState } from "react";
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
      setComments(res.documents as any);
      setTotal(res.total || res.documents.length);
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
        className="pointer-events-auto flex h-full w-full max-w-[420px] flex-col border-l border-neutral-800 bg-neutral-950 text-white"
        role="dialog"
        aria-label="Comments"
      >
        <div className="flex items-center justify-between border-b border-neutral-800 px-4 py-3">
          <div className="text-sm font-medium">Comments{typeof total === "number" ? ` (${total})` : ""}</div>
          <button onClick={closeComments} aria-label="Close comments" className="rounded px-2 py-1 text-sm opacity-80 hover:opacity-100">✕</button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {loading && <div className="py-6 text-center text-sm text-neutral-400">Loading...</div>}
          {error && <div className="py-6 text-center text-sm text-red-400">{error}</div>}
          {!loading && !error && comments.length === 0 && (
            <div className="py-6 text-center text-sm text-neutral-400">No comments yet</div>
          )}
          <div className="flex flex-col gap-3">
            {comments.map((c) => (
              <div key={c.$id} className="flex gap-3">
                <div className="h-9 w-9 shrink-0 rounded-full bg-neutral-800" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-xs text-neutral-400">
                    <span className="truncate">{(c as any).user_id || "user"}</span>
                    <span>•</span>
                    <span>{new Date(String((c as any).created_at || c.$createdAt)).toLocaleString()}</span>
                  </div>
                  <div className="text-sm leading-relaxed text-neutral-100 break-words">{(c as any).text}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={submit} className="flex items-center gap-2 border-t border-neutral-800 p-3">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={user ? "Add a comment" : "Log in to comment"}
            disabled={!user}
            className="flex-1 rounded-md border border-neutral-800 bg-black/60 px-3 py-2 text-sm disabled:opacity-60"
            aria-label="Comment text"
          />
          <button
            type="submit"
            disabled={!user || !text.trim() || posting}
            className="rounded-md bg-emerald-600 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Post comment"
          >
            Post
          </button>
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

