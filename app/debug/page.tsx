"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useUser } from "@/app/context/user";
import { storage, database, Query, ID, Permission, Role } from "@/libs/AppWriteClient";

export default function DebugPage() {
  const { user, loading } = useUser();
  const [output, setOutput] = useState<string>("");
  const [copyLabel, setCopyLabel] = useState("Copy");
  const outRef = useRef<HTMLPreElement | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [caption, setCaption] = useState<string>("");
  const [postText, setPostText] = useState<string>("");
  const [posting, setPosting] = useState<boolean>(false);

  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_URL || process.env.NEXT_PUBLIC_ENDPOINT;
  const project = process.env.NEXT_PUBLIC_APPWRITE_PROJECT;
  const bucketId = process.env.NEXT_PUBLIC_BUCKET_ID;
  const fileId = process.env.NEXT_PUBLIC_PLACEHOLDER_DEFAULT_IMAGE_ID;
  const dbId = process.env.NEXT_PUBLIC_DATABASE_ID as string | undefined;
  const colProfile = process.env.NEXT_PUBLIC_COLLECTION_ID_PROFILE as string | undefined;
  const colPost = process.env.NEXT_PUBLIC_COLLECTION_ID_POST as string | undefined;

  const sessionState = useMemo(() => (loading ? "checking" : user ? `logged in as ${user.$id}` : "no session"), [loading, user]);

  const write = (line = "") => setOutput((prev) => (prev ? prev + "\n" + line : line));

  useEffect(() => {
    setOutput("");
    write("# Appwrite Debug Console");
    write(`endpoint: ${endpoint || "(not set)"}`);
    write(`project: ${project || "(not set)"}`);
    write(`db: ${dbId || "(not set)"} • collection: ${colProfile || "(not set)"}`);
    write(`bucket: ${bucketId || "(not set)"} • file: ${fileId || "(not set)"}`);
    write(`post.collection: ${colPost || "(not set)"}`);
    write("---");

    // Health check
    (async () => {
      try {
        if (!endpoint) throw new Error("endpoint not set");
        const res = await fetch(`${endpoint}/health/version`, { cache: "no-store" });
        const data = await res.json();
        write(`health: OK • Appwrite ${data?.version ?? "?"}`);
      } catch (e: any) {
        write(`health: ERROR • ${String(e?.message || e)}`);
      }
    })();

    // Session
    write(`session: ${sessionState}`);

    // Storage URLs (no image render)
    try {
      if (bucketId && fileId) {
        const preview = storage.getFilePreview(String(bucketId), String(fileId)).toString();
        const view = storage.getFileView(String(bucketId), String(fileId)).toString();
        write(`storage.preview: ${preview}`);
        write(`storage.view: ${view}`);
      }
    } catch (e: any) {
      write(`storage.urls: ERROR • ${String(e?.message || e)}`);
    }

    // List docs (best-effort)
    (async () => {
      try {
        if (dbId && colProfile) {
          const res = await database.listDocuments(dbId, colProfile, [Query.limit(5)]);
          const sample = res.documents.map((d) => d.$id);
          write(`db.list: total=${res.total} sample=${JSON.stringify(sample)}`);
        }
      } catch (e: any) {
        write(`db.list: ERROR • ${String(e?.message || e)} (check Read perms for role:users/any)`);
      }
    })();

    // List files (best-effort)
    (async () => {
      try {
        if (bucketId) {
          const res = await storage.listFiles(String(bucketId), [Query.limit(5)] as any);
          const sample = res.files.map((f) => `${f.$id}:${f.name}`);
          write(`storage.list: total=${res.total} sample=${JSON.stringify(sample)}`);
        }
      } catch (e: any) {
        write(`storage.list: ERROR • ${String(e?.message || e)} (check Read perms for role:users/any)`);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint, project, dbId, colProfile, bucketId, fileId, sessionState]);

  useEffect(() => {
    try { outRef.current?.scrollTo({ top: outRef.current.scrollHeight }); } catch {}
  }, [output]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(output);
      setCopyLabel("Copied");
      setTimeout(() => setCopyLabel("Copy"), 1200);
    } catch {
      setCopyLabel("Copy failed");
      setTimeout(() => setCopyLabel("Copy"), 1500);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="mb-3 flex items-center justify-between">
        <h1 className="text-lg font-semibold">Appwrite Debug Console</h1>
        <div className="flex gap-2">
          <button onClick={copy} className="rounded bg-black px-3 py-1.5 text-white">{copyLabel}</button>
          <button onClick={() => window.location.reload()} className="rounded bg-gray-200 px-3 py-1.5 text-black">Refresh</button>
        </div>
      </div>
      {/* Post Tests */}
      <div className="mb-4 rounded border border-gray-700 p-3">
        <div className="mb-2 font-medium">Post tests (upload video + create doc)</div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            type="file"
            accept="video/*"
            onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-gray-200 file:mr-4 file:rounded file:border-0 file:bg-gray-100 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-gray-900 hover:file:bg-gray-200"
          />
          <input
            type="text"
            placeholder="Caption (optional)"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="w-full rounded border border-gray-600 bg-transparent px-3 py-1.5 text-sm text-white placeholder-gray-400 focus:outline-none sm:w-60"
          />
          <input
            type="text"
            placeholder="Text (optional)"
            value={postText}
            onChange={(e) => setPostText(e.target.value)}
            className="w-full rounded border border-gray-600 bg-transparent px-3 py-1.5 text-sm text-white placeholder-gray-400 focus:outline-none sm:w-72"
          />
          <button
            onClick={async () => {
              setPosting(true);
              try {
                if (!user) throw new Error("No session. Log in first.");
                if (!endpoint || !project) throw new Error("Missing Appwrite env (endpoint/project)");
                if (!bucketId) throw new Error("Missing NEXT_PUBLIC_BUCKET_ID");
                if (!dbId || !colPost) throw new Error("Missing NEXT_PUBLIC_DATABASE_ID or NEXT_PUBLIC_COLLECTION_ID_POST");
                if (!videoFile) throw new Error("Select a video file first");

                write("---");
                write(`# Post test started @ ${new Date().toISOString()}`);
                write(`user: ${user.$id}`);
                write(`video: name=${videoFile.name} size=${videoFile.size}`);

                // 1) Upload video to Storage
                const newFileId = ID.unique();
                const createdFile = await storage.createFile(String(bucketId), newFileId, videoFile, [
                  Permission.read(Role.any()),
                  Permission.update(Role.user(user.$id)),
                  Permission.delete(Role.user(user.$id)),
                ] as any);
                write(`storage.upload: OK id=${createdFile.$id} name=${createdFile.name}`);
                const fileView = storage.getFileView(String(bucketId), String(createdFile.$id)).toString();
                write(`storage.view: ${fileView}`);

                // 2) Inspect schema (if server API key configured) to map attribute names
                let userKey = "userid";
                let videoKey = "videoId";
                let captionKey = "caption";
                let textKey = "text";
                let createdAtKey = "createdAt";
                try {
                  const url = new URL(window.location.origin + "/api/admin/collection");
                  url.searchParams.set("db", String(dbId));
                  url.searchParams.set("col", String(colPost));
                  const schemaRes = await fetch(url.toString(), { cache: "no-store" });
                  if (schemaRes.ok) {
                    const json = await schemaRes.json();
                    const attrs: any[] = json?.data?.attributes ?? [];
                    const has = (name: string) => attrs.some((a: any) => a.key === name || a.$id === name || a?.key === name);
                    // Choose best-known keys if present
                    if (has("user_id")) userKey = "user_id";
                    else if (has("userid")) userKey = "userid";
                    else if (has("userId")) userKey = "userId";

                    if (has("video_id")) videoKey = "video_id";
                    else if (has("videoId")) videoKey = "videoId";
                    else if (has("file_id")) videoKey = "file_id";
                    else if (has("fileId")) videoKey = "fileId";
                    else if (has("video")) videoKey = "video";

                    if (has("created_at")) createdAtKey = "created_at";
                    else if (has("createdAt")) createdAtKey = "createdAt";
                    else if (has("timestamp")) createdAtKey = "timestamp";

                    if (has("caption")) captionKey = "caption";
                    else if (has("text")) captionKey = "text";
                    // explicit text field
                    if (has("text")) textKey = "text";
                  } else {
                    write(`schema: skipped (${schemaRes.status}) — set APPWRITE_API_KEY to enable`);
                  }
                } catch (e: any) {
                  write(`schema: ERROR • ${String(e?.message || e)}`);
                }

                // 3) Create Post document with mapped keys
                const createdAt = new Date().toISOString();
                const docId = ID.unique();
                const textVal = (postText || "").slice(0, 150);
                const payload: any = {
                  [userKey]: user.$id,
                  [videoKey]: createdFile.$id,
                  [createdAtKey]: createdAt,
                };
                if (caption) (payload as any)[captionKey] = caption;
                if (textVal) (payload as any)[textKey] = textVal;
                const perms = [
                  Permission.read(Role.any()),
                  Permission.update(Role.user(user.$id)),
                  Permission.delete(Role.user(user.$id)),
                ];
                async function tryCreate(doc: any) {
                  return await database.createDocument(String(dbId), String(colPost), docId, doc, perms as any);
                }
                try {
                  const postDoc = await tryCreate(payload);
                  write(`db.create.post: OK id=${postDoc.$id}`);
                  write(`post: ${JSON.stringify({ ...payload, $id: postDoc.$id })}`);
                } catch (err: any) {
                  // Sequential fallbacks to accommodate different Post schemas (with required text)
                  const baseText = textVal;
                  const baseCommon: any = { user_id: user.$id };
                  if (caption) baseCommon.caption = caption;
                  const withUrl: any = { ...baseCommon, video_url: fileView };
                  const withId: any = { ...baseCommon, video_id: createdFile.$id };
                  const withUrlCreated: any = { ...withUrl, created_at: createdAt };
                  const withIdCreated: any = { ...withId, created_at: createdAt };
                  if (baseText) {
                    withUrl.text = baseText;
                    withId.text = baseText;
                    withUrlCreated.text = baseText;
                    withIdCreated.text = baseText;
                  }
                  const variants: Array<{ name: string; doc: any }> = [
                    { name: "snake_url_created", doc: withUrlCreated },
                    { name: "snake_url_min", doc: withUrl },
                    { name: "snake_id_created", doc: withIdCreated },
                    { name: "snake_id_min", doc: withId },
                  ];
                  let lastErr: any = err;
                  for (const v of variants) {
                    try {
                      const postDoc = await tryCreate(v.doc);
                      write(`db.create.post: OK (${v.name}) id=${postDoc.$id}`);
                      write(`post: ${JSON.stringify({ ...v.doc, $id: postDoc.$id })}`);
                      lastErr = null;
                      break;
                    } catch (e: any) {
                      lastErr = e;
                    }
                  }
                  if (lastErr) throw lastErr;
                }
              } catch (e: any) {
                write(`POST TEST ERROR • ${String(e?.message || e)}`);
              } finally {
                setPosting(false);
              }
            }}
            disabled={posting || !videoFile}
            className="rounded bg-emerald-600 px-3 py-1.5 text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {posting ? "Posting..." : "Upload + Create Post"}
          </button>
        </div>
        {!user && (
          <div className="mt-2 text-xs text-amber-300">No session detected. Open the homepage to log in anonymously first.</div>
        )}
      </div>
      <pre ref={outRef} className="h-[60vh] w-full overflow-auto rounded border border-gray-700 bg-black/70 p-3 text-xs leading-relaxed text-green-200">
{output}
      </pre>
    </div>
  );
}
