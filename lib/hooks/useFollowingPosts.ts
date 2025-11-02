"use client";
import { useCallback, useEffect, useState } from "react";
import type { Models } from "appwrite";
import { database, Query } from "@/libs/AppWriteClient";

export function useFollowingPosts(userId?: string, limit = 20) {
  const [docs, setDocs] = useState<Models.Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const dbId = process.env.NEXT_PUBLIC_DATABASE_ID as string;
  const colPost = process.env.NEXT_PUBLIC_COLLECTION_ID_POST as string;
  const colFollow = process.env.NEXT_PUBLIC_COLLECTION_ID_FOLLOW as string;

  const fetchPosts = useCallback(async () => {
    if (!userId) { setDocs([]); return; }
    setLoading(true);
    setError(null);
    try {
      // 1) List who I follow
      const followingRes = await database.listDocuments(dbId, colFollow, [
        Query.equal("follower_id", userId),
        Query.limit(100),
      ] as any);
      const followingIds = followingRes.documents.map((d: any) => String(d.following_id)).filter(Boolean);
      if (followingIds.length === 0) { setDocs([]); return; }

      // 2) Fetch posts per followed user to avoid backend limitations with IN+sort
      // Align with PostCard author detection to support legacy/variant schemas
      const authorKeys = [
        "user_id",
        "userid",
        "userId",
        "author_id",
        "authorId",
        "owner_id",
        "ownerId",
        "user",
        "author",
        "uid",
      ];
      const seen = new Set<string>();
      const merged: Models.Document[] = [];
      for (const fid of followingIds) {
        let fetchedForThisUser = false;
        for (const key of authorKeys) {
          try {
            const res = await database.listDocuments(dbId, colPost, [
              Query.equal(key, String(fid)),
              Query.orderDesc("$createdAt"),
              Query.limit(Math.max(10, Math.min(50, limit))),
            ] as any);
            if (res.documents?.length) {
              for (const d of res.documents) {
                if (!seen.has(d.$id)) { seen.add(d.$id); merged.push(d); }
              }
              fetchedForThisUser = true;
              break; // stop trying other keys for this user id
            }
          } catch {
            // ignore key errors (attribute not indexed/defined)
          }
        }
        if (!fetchedForThisUser) {
          // no-op; fallback below will try best-effort
        }
      }
      // If no or too few results via indexed queries, fall back to client-side filter
      if (merged.length === 0) {
        try {
          const fallback = await database.listDocuments(dbId, colPost, [
            Query.orderDesc("$createdAt"),
            Query.limit(200),
          ] as any);
          for (const d of fallback.documents) {
            const any: any = d as any;
            const authorVal = authorKeys.map((k) => (k in any ? String(any[k]) : "")).find((v) => !!v);
            if (authorVal && followingIds.includes(authorVal) && !seen.has(d.$id)) {
              seen.add(d.$id);
              merged.push(d);
            }
          }
        } catch { /* ignore */ }
      }

      // Sort merged by created time desc and apply limit
      merged.sort((a: any, b: any) => (a.$createdAt < b.$createdAt ? 1 : -1));
      setDocs(merged.slice(0, limit));
    } catch (err) {
      setError(err);
      setDocs([]);
    } finally {
      setLoading(false);
    }
  }, [userId, dbId, colFollow, colPost, limit]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  return { posts: docs, loading, error, refresh: fetchPosts };
}
