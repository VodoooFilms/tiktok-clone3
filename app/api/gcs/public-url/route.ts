import { NextRequest, NextResponse } from "next/server";
import { getPublicUrl } from "@/lib/server/gcs";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const objectName = url.searchParams.get("object");
    if (!objectName) {
      return NextResponse.json({ ok: false, error: "Missing object query param" }, { status: 400 });
    }
    const publicUrl = getPublicUrl(objectName);
    return NextResponse.json({ ok: true, url: publicUrl });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}

