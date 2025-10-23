import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_URL || process.env.NEXT_PUBLIC_ENDPOINT;
  if (!endpoint) {
    return NextResponse.json({ ok: false, error: "APPWRITE endpoint not configured" }, { status: 500 });
  }
  try {
    const res = await fetch(`${endpoint}/health/version`, { cache: "no-store" });
    const data = await res.json();
    return NextResponse.json({ ok: true, data });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}

