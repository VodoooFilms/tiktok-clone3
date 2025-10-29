"use client";
import UploadLayout from "@/app/layouts/UploadLayout";
import { useState, useMemo, useRef } from "react";
import { useUser } from "@/app/context/user";
import { database, ID, Permission, Role } from "@/libs/AppWriteClient";
import { useRouter } from "next/navigation";

export default function UploadPage() {
  const { user } = useUser();
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [log, setLog] = useState<string>("");
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string>("");
  const [showFx, setShowFx] = useState(false);
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
      if (!dbId || !colPost) throw new Error("Missing NEXT_PUBLIC_DATABASE_ID/COLLECTION_ID_POST");
      if (!file) throw new Error("Pick a video file first");
      const MAX_MB = 100; // adjust as needed
      if (file.size > MAX_MB * 1024 * 1024) {
        throw new Error(`File too large. Max ${MAX_MB}MB`);
      }

      write(`# Upload start @ ${new Date().toISOString()}`);
      write(`file: ${file.name} (${file.size} bytes)`);

      // Upload to GCS via API
      setProgress(null); // indeterminate
      const form = new FormData();
      form.append("file", file);
      form.append("kind", "video");
      const upRes = await fetch("/api/gcs/upload", {
        method: "POST",
        body: form,
        headers: user ? { "x-user-id": user.$id } as any : undefined,
      });
      if (!upRes.ok) {
        const err = await upRes.json().catch(() => ({}));
        throw new Error(String(err?.error || `Upload failed (${upRes.status})`));
      }
      const upJson = await upRes.json();
      const fileView: string = String(upJson.url);
      write(`gcs: OK object=${upJson.object}`);

      // Prepare Post doc for your schema (snake_case)
      const baseText = (text || "").slice(0, 150);
      const baseCommon: any = { user_id: user.$id };
      // Build variants with optional text (no custom created_at; rely on $createdAt)
      const withUrl: any = { ...baseCommon, video_url: fileView };
      const withId: any = { ...baseCommon, video_url: fileView };
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
        <div className="order-2 md:order-1">
          <div className="flex w-full justify-center">
            <div className="relative max-w-[80vw] sm:max-w-[16rem] md:max-w-[18rem] lg:max-w-[22rem] w-full rounded-2xl border border-neutral-800 bg-gradient-to-b from-neutral-950 to-neutral-900 shadow-xl ring-1 ring-black/10 overflow-hidden">
              {previewUrl ? (
                <video ref={videoRef} src={previewUrl} className="aspect-[9/16] w-full object-cover rounded-xl" muted playsInline loop controls />
              ) : (
                <div className="aspect-[9/16] w-full grid place-items-center text-sm text-neutral-400">
                  Select a video to preview
                </div>
              )}
            </div>
          </div>
          {submitting && (
            <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-neutral-800">
              <div className="h-full w-1/2 animate-pulse bg-emerald-600"></div>
            </div>
          )}
          {error && <div className="mt-2 text-sm text-red-400">{error}</div>}
        </div>
        <form onSubmit={onSubmit} className="order-1 md:order-2 flex flex-col gap-3">
          <p className="text-xs text-neutral-400">
            Post responsibly, with creativity and originality.
          </p>
          <label className="text-sm">
            Text (optional)
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="mt-1 w-full resize-y rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              placeholder="Brief description (max 150 chars)"
              maxLength={150}
              rows={3}
            />
          </label>
          <label className="text-sm">
            Video file
            <input
              type="file"
              accept="video/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="mt-1 w-full rounded-xl border border-dashed border-neutral-700 bg-neutral-950 px-3 py-2 text-white file:mr-4 file:rounded-lg file:border-0 file:bg-emerald-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              required
            />
          </label>
          <div className="mt-3 flex flex-col items-stretch justify-center gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center">
            <button
              type="button"
              onClick={() => {
                setText("");
                setFile(null);
                try { if (videoRef.current) videoRef.current.load(); } catch {}
              }}
              className="w-full sm:w-auto rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-2 text-white hover:bg-neutral-900 active:bg-neutral-900/80"
            >
              Discard
            </button>
            <button
              type="button"
              onClick={() => setShowFx(true)}
              className="w-full sm:w-auto rounded-xl border border-emerald-700/40 bg-emerald-600/10 px-4 py-2 text-emerald-300 hover:bg-emerald-600/20 active:bg-emerald-600/25"
            >
              Apply AI FX to this video
            </button>
            <button
              type="submit"
              disabled={submitting || !file}
              className="w-full sm:w-auto rounded-2xl bg-emerald-600 px-6 md:px-8 py-2.5 text-white font-semibold shadow-sm hover:bg-emerald-500 active:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
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
      {showFx && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-neutral-800 bg-neutral-950 p-4 shadow-2xl">
            <div className="mb-2 text-base font-semibold text-white">AI FX</div>
            <p className="text-sm text-neutral-300">For Pro Users, subscribe</p>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setShowFx(false)}
                className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-sm text-white hover:bg-neutral-800"
                aria-label="Close"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </UploadLayout>
  );
}




