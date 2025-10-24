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

      // 2) Fetch posts for potential author keys; merge results
      const authorKeys = ["user_id", "userid", "userId"];
      const seen = new Set<string>();
      const merged: Models.Document[] = [];
      for (const key of authorKeys) {
        try {
          const res = await database.listDocuments(dbId, colPost, [
            Query.equal(key, followingIds as any),
            Query.orderDesc("$createdAt"),
            Query.limit(limit),
          ] as any);
          for (const d of res.documents) {
            if (!seen.has(d.$id)) { seen.add(d.$id); merged.push(d); }
          }
        } catch { /* ignore key errors */ }
      }
      // Sort merged by created time desc
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

