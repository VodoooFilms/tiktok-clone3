"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { Models } from "appwrite";
import { database, storage } from "@/libs/AppWriteClient";
import MainLayout from "@/app/layouts/MainLayout";

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [doc, setDoc] = useState<Models.Document | null>(null);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const databaseId = process.env.NEXT_PUBLIC_DATABASE_ID as string;
  const collectionId = process.env.NEXT_PUBLIC_COLLECTION_ID_POST as string;
  const bucketId = process.env.NEXT_PUBLIC_BUCKET_ID as string | undefined;

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
        </div>
      </section>
    </MainLayout>
  );
}

