import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    // Trust the app client to provide the user id. This avoids cross-domain cookie issues with Appwrite.
    const headerUser = request.headers.get("x-user-id");
    const userId = headerUser ? String(headerUser) : "anon";

    const form = await request.formData();
    const file = form.get("file");
    const kind = String(form.get("kind") || "media"); // e.g., "video" | "image"
    if (!file || typeof file === "string") {
      return NextResponse.json({ ok: false, error: "Missing file" }, { status: 400 });
    }
    const f = file as File;
    const arrayBuffer = await f.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = f.type || "application/octet-stream";
    const original = f.name || `upload-${Date.now()}`;
    const safeName = original.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9._-]/g, "");
    const objectName = `${kind}/${userId}/${Date.now()}-${safeName}`;

    const { getStorage, getBucketName } = await import("@/lib/gcs");
    const storage = getStorage();
    const bucketName = getBucketName();
    const bucket = storage.bucket(bucketName);
    const fileRef = bucket.file(objectName);
    await fileRef.save(buffer, {
      resumable: false,
      contentType,
      metadata: { cacheControl: "public, max-age=31536000, immutable" },
    });

    // Public URL (requires bucket-level public access when Uniform ACL is enabled)
    const url = `https://storage.googleapis.com/${bucketName}/${encodeURIComponent(objectName)}`;

    return NextResponse.json({ ok: true, url, object: objectName, contentType });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}
