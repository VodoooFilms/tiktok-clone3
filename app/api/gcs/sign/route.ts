import { NextRequest, NextResponse } from "next/server";
import { buildObjectName, createSignedUploadUrl, getPublicUrl } from "@/lib/server/gcs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json().catch(() => null as any);
    const { fileName, contentType, prefix } = (payload || {}) as {
      fileName?: string;
      contentType?: string;
      prefix?: string;
    };

    if (!fileName || typeof fileName !== "string") {
      return NextResponse.json({ error: "Missing fileName" }, { status: 400 });
    }

    const objectName = buildObjectName(fileName, typeof prefix === "string" ? prefix : undefined);
    const { url, headers, method } = await createSignedUploadUrl(
      objectName,
      typeof contentType === "string" ? contentType : undefined,
      600,
    );

    return NextResponse.json({
      uploadUrl: url,
      method,
      headers,
      objectName,
      publicUrl: getPublicUrl(objectName),
      expiresInSeconds: 600,
    });
  } catch (error: any) {
    const message = error?.message ?? "Failed to create signed URL";
    console.error("[api/gcs/sign] error", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

