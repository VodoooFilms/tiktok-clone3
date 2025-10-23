"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useUser } from "@/app/context/user";
import { storage, database, Query } from "@/libs/AppWriteClient";

export default function DebugPage() {
  const { user, loading } = useUser();
  const [output, setOutput] = useState<string>("");
  const [copyLabel, setCopyLabel] = useState("Copy");
  const outRef = useRef<HTMLPreElement | null>(null);

  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_URL || process.env.NEXT_PUBLIC_ENDPOINT;
  const project = process.env.NEXT_PUBLIC_APPWRITE_PROJECT;
  const bucketId = process.env.NEXT_PUBLIC_BUCKET_ID;
  const fileId = process.env.NEXT_PUBLIC_PLACEHOLDER_DEFAULT_IMAGE_ID;
  const dbId = process.env.NEXT_PUBLIC_DATABASE_ID as string | undefined;
  const colProfile = process.env.NEXT_PUBLIC_COLLECTION_ID_PROFILE as string | undefined;

  const sessionState = useMemo(() => (loading ? "checking" : user ? `logged in as ${user.$id}` : "no session"), [loading, user]);

  const write = (line = "") => setOutput((prev) => (prev ? prev + "\n" + line : line));

  useEffect(() => {
    setOutput("");
    write("# Appwrite Debug Console");
    write(`endpoint: ${endpoint || "(not set)"}`);
    write(`project: ${project || "(not set)"}`);
    write(`db: ${dbId || "(not set)"} • collection: ${colProfile || "(not set)"}`);
    write(`bucket: ${bucketId || "(not set)"} • file: ${fileId || "(not set)"}`);
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
      <pre ref={outRef} className="h-[60vh] w-full overflow-auto rounded border border-gray-700 bg-black/70 p-3 text-xs leading-relaxed text-green-200">
{output}
      </pre>
    </div>
  );
}

