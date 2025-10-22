"use client";
import { useEffect, useState, useCallback } from "react";
import { Models } from "appwrite";
import { database } from "@/libs/AppWriteClient";

export function useProfile(id?: string) {
  const [doc, setDoc] = useState<Models.Document | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const databaseId = process.env.NEXT_PUBLIC_DATABASE_ID as string;
  const collectionId = process.env.NEXT_PUBLIC_COLLECTION_ID_PROFILE as string;

  const fetchProfile = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await database.getDocument(databaseId, collectionId, id);
      setDoc(res);
    } catch (err) {
      setError(err);
      setDoc(null);
    } finally {
      setLoading(false);
    }
  }, [id, databaseId, collectionId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return { profile: doc, loading, error, refresh: fetchProfile };
}

