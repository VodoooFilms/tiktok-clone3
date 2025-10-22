"use client";
import { useEffect, useState, useCallback } from "react";
import { Models } from "appwrite";
import { database, Query } from "@/libs/AppWriteClient";

export function usePosts(limit = 20) {
  const [docs, setDocs] = useState<Models.Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const databaseId = process.env.NEXT_PUBLIC_DATABASE_ID as string;
  const collectionId = process.env.NEXT_PUBLIC_COLLECTION_ID_POST as string;

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await database.listDocuments(databaseId, collectionId, [
        Query.limit(limit),
        Query.orderDesc("$createdAt"),
      ]);
      setDocs(res.documents);
    } catch (err) {
      setError(err);
      setDocs([]);
    } finally {
      setLoading(false);
    }
  }, [limit, databaseId, collectionId]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  return { posts: docs, loading, error, refresh: fetchPosts };
}

