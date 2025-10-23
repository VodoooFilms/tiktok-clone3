import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const db = url.searchParams.get("db");
  const col = url.searchParams.get("col");

  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_URL || process.env.NEXT_PUBLIC_ENDPOINT;
  const project = process.env.NEXT_PUBLIC_APPWRITE_PROJECT;
  const apiKey = process.env.APPWRITE_API_KEY; // server-side only

  if (!endpoint || !project) {
    return NextResponse.json({ ok: false, error: "Missing endpoint/project env" }, { status: 500 });
  }
  if (!apiKey) {
    return NextResponse.json({ ok: false, error: "Server missing APPWRITE_API_KEY" }, { status: 401 });
  }
  if (!db || !col) {
    return NextResponse.json({ ok: false, error: "Missing db or col query params" }, { status: 400 });
  }
  try {
    const res = await fetch(`${endpoint}/databases/${db}/collections/${col}`, {
      method: "GET",
      headers: {
        "X-Appwrite-Project": String(project),
        "X-Appwrite-Key": apiKey,
      },
      cache: "no-store",
    });
    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({ ok: false, error: data?.message || `HTTP ${res.status}` }, { status: res.status });
    }
    return NextResponse.json({ ok: true, data });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}

