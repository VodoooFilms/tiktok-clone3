import { NextRequest, NextResponse } from "next/server";
import { buildObjectName, createSignedUploadUrl, getPublicUrl, uploadBufferToGcs } from "@/lib/server/gcs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const envUploadLimit = Number(process.env.UPLOAD_MAX_MB ?? process.env.NEXT_PUBLIC_UPLOAD_MAX_MB ?? "");
const SERVER_MAX_MB = Number.isFinite(envUploadLimit) && envUploadLimit > 0 ? envUploadLimit : 500;
export const maxRequestBodySize = `${SERVER_MAX_MB}mb`;

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const payload = await req.json();
      const { fileName, contentType: fileContentType, prefix, size, expiresInSeconds } = payload || {};
      if (!fileName || typeof fileName !== "string") {
        return NextResponse.json({ error: "Missing fileName" }, { status: 400 });
      }

      const normalizedPrefix = typeof prefix === "string" && prefix.trim().length ? prefix : undefined;
      const objectName = buildObjectName(fileName, normalizedPrefix);
      const { url, headers, expiresAt, method } = await createSignedUploadUrl(
        objectName,
        typeof fileContentType === "string" ? fileContentType : undefined,
        typeof expiresInSeconds === "number" ? expiresInSeconds : undefined,
      );

      return NextResponse.json({
        strategy: "direct",
        uploadUrl: url,
        method,
        headers,
        objectName,
        publicUrl: getPublicUrl(objectName),
        expiresAt,
        maxUploadBytes: SERVER_MAX_MB * 1024 * 1024,
        requestedBytes: typeof size === "number" ? size : undefined,
      });
    }

    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json({ error: "Expected multipart/form-data or application/json" }, { status: 400 });
    }

    const formData = await req.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing file field" }, { status: 400 });
    }

    const prefixEntry = formData.get("prefix") ?? formData.get("folder");
    const prefix = typeof prefixEntry === "string" && prefixEntry.trim().length ? prefixEntry : undefined;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (buffer.length > SERVER_MAX_MB * 1024 * 1024) {
      return NextResponse.json(
        { error: `File exceeds ${SERVER_MAX_MB}MB limit` },
        { status: 413 },
      );
    }

    const objectName = buildObjectName(file.name || "upload.bin", prefix);
    await uploadBufferToGcs(buffer, objectName, file.type || undefined);
    const publicUrl = getPublicUrl(objectName);

    return NextResponse.json(
      {
        strategy: "server",
        objectName,
        publicUrl,
        contentType: file.type,
        size: buffer.length,
      },
      { status: 201 },
    );
  } catch (error: any) {
    const message = error?.message ?? "Upload failed";
    console.error("[api/uploads] error", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
