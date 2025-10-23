"use client";
import UploadLayout from "@/app/layouts/UploadLayout";
import { useState, useMemo, useRef } from "react";
import { useUser } from "@/app/context/user";
import { storage, database, ID, Permission, Role } from "@/libs/AppWriteClient";
import { useRouter } from "next/navigation";

export default function UploadPage() {
  const { user } = useUser();
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [log, setLog] = useState<string>("");
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string>("");
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : ""), [file]);
  const bucketId = process.env.NEXT_PUBLIC_BUCKET_ID as string | undefined;
  const dbId = process.env.NEXT_PUBLIC_DATABASE_ID as string | undefined;
  const colPost = process.env.NEXT_PUBLIC_COLLECTION_ID_POST as string | undefined;

  const write = (line: string) => setLog((p) => (p ? p + "\n" + line : line));
  const router = useRouter();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError("");
    setLog("");
    try {
      if (!user) throw new Error("No session. Log in first.");
      if (!bucketId) throw new Error("Missing NEXT_PUBLIC_BUCKET_ID");
      if (!dbId || !colPost) throw new Error("Missing NEXT_PUBLIC_DATABASE_ID/COLLECTION_ID_POST");
      if (!file) throw new Error("Pick a video file first");
      const MAX_MB = 100; // adjust as needed
      if (file.size > MAX_MB * 1024 * 1024) {
        throw new Error(`File too large. Max ${MAX_MB}MB`);
      }

      write(`# Upload start @ ${new Date().toISOString()}`);
      write(`file: ${file.name} (${file.size} bytes)`);

      // Upload to storage
      const fileId = ID.unique();
      setProgress(null); // indeterminate
      const createdFile = await storage.createFile(String(bucketId), fileId, file, [
        Permission.read(Role.any()),
        Permission.update(Role.user(user.$id)),
        Permission.delete(Role.user(user.$id)),
      ] as any);
      const fileView = storage.getFileView(String(bucketId), String(createdFile.$id)).toString();
      write(`storage: OK id=${createdFile.$id}`);

      // Prepare Post doc for your schema (snake_case)
      const baseText = (text || "").slice(0, 150);
      const baseCommon: any = { user_id: user.$id };
      if (caption) baseCommon.caption = caption;
      // Build variants with optional text (no custom created_at; rely on $createdAt)
      const withUrl: any = { ...baseCommon, video_url: fileView };
      const withId: any = { ...baseCommon, video_id: createdFile.$id };
      if (baseText) {
        withUrl.text = baseText;
        withId.text = baseText;
      }
      const variants: Array<{ name: string; doc: any }> = [
        { name: "snake_url_min", doc: withUrl },
        { name: "snake_id_min", doc: withId },
      ];
      const perms = [
        Permission.read(Role.any()),
        Permission.update(Role.user(user.$id)),
        Permission.delete(Role.user(user.$id)),
      ];
      const docId = ID.unique();
      let lastErr: any = null;
      let createdPostId: string | null = null;
      for (const v of variants) {
        try {
          const postDoc = await database.createDocument(String(dbId), String(colPost), docId, v.doc, perms as any);
          write(`post: OK (${v.name}) id=${postDoc.$id}`);
          setCaption("");
          setText("");
          setFile(null);
          try { if (videoRef.current) videoRef.current.load(); } catch {}
          lastErr = null;
          createdPostId = postDoc.$id;
          break;
        } catch (e: any) {
          lastErr = e;
        }
      }
      if (lastErr) throw lastErr;
      if (createdPostId) {
        router.push(`/post/${createdPostId}`);
      }
    } catch (e: any) {
      const msg = String(e?.message || e);
      write(`ERROR • ${msg}`);
      setError(msg);
    } finally {
      setSubmitting(false);
      setProgress(null);
    }
  };

  return (
    <UploadLayout>
      <section className="grid grid-cols-1 gap-6 p-4 md:grid-cols-2">
        <div>
          <div className="aspect-[9/16] w-full overflow-hidden rounded border border-neutral-800 bg-neutral-900">
            {previewUrl ? (
              <video ref={videoRef} src={previewUrl} className="h-full w-full object-contain" controls />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm text-neutral-400">
                Select a video to preview
              </div>
            )}
          </div>
          {submitting && (
            <div className="mt-2 h-1 w-full overflow-hidden rounded bg-neutral-800">
              <div className="h-full w-1/2 animate-pulse bg-emerald-600"></div>
            </div>
          )}
          {error && <div className="mt-2 text-sm text-red-400">{error}</div>}
        </div>
        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <label className="text-sm">
            Caption
            <input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="mt-1 w-full rounded border border-neutral-800 bg-black px-3 py-2 text-white placeholder-neutral-500"
              placeholder="Write a caption"
            />
          </label>
          <label className="text-sm">
            Text (optional)
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="mt-1 w-full rounded border border-neutral-800 bg-black px-3 py-2 text-white placeholder-neutral-500"
              placeholder="Brief description (max 150 chars)"
              maxLength={150}
            />
          </label>
          <label className="text-sm">
            Video file
            <input
              type="file"
              accept="video/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="mt-1 w-full rounded border border-neutral-800 bg-black file:mr-4 file:rounded file:border-0 file:bg-neutral-100 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-black hover:file:bg-neutral-200"
              required
            />
          </label>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => {
                setCaption("");
                setText("");
                setFile(null);
                try { if (videoRef.current) videoRef.current.load(); } catch {}
              }}
              className="rounded border border-neutral-800 px-3 py-2 text-white hover:bg-neutral-900"
            >
              Discard
            </button>
            <button
              type="submit"
              disabled={submitting || !file}
              className="rounded bg-emerald-600 px-3 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Posting…" : "Post"}
            </button>
          </div>
          {log && (
            <pre className="max-h-40 overflow-auto rounded border border-neutral-800 bg-neutral-900 p-2 text-xs text-emerald-200">
{log}
            </pre>
          )}
        </form>
      </section>
    </UploadLayout>
  );
}
