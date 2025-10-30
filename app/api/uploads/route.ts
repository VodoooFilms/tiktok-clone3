import { NextRequest, NextResponse } from "next/server";
import { buildObjectName, getPublicUrl, uploadBufferToGcs } from "@/lib/server/gcs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    if (!req.headers.get("content-type")?.includes("multipart/form-data")) {
      return NextResponse.json({ error: "Expected multipart/form-data" }, { status: 400 });
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
    const objectName = buildObjectName(file.name || "upload.bin", prefix);
    await uploadBufferToGcs(buffer, objectName, file.type || undefined);
    const publicUrl = getPublicUrl(objectName);

    return NextResponse.json(
      {
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
