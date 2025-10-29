import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const endpoint = (process.env.NEXT_PUBLIC_APPWRITE_URL || process.env.NEXT_PUBLIC_ENDPOINT) as string | undefined;
    const project = process.env.NEXT_PUBLIC_APPWRITE_PROJECT as string | undefined;
    const apiKey = process.env.APPWRITE_API_KEY as string | undefined;
    const databaseId = process.env.NEXT_PUBLIC_DATABASE_ID as string | undefined;
    const collectionId = process.env.NEXT_PUBLIC_COLLECTION_ID_PROFILE as string | undefined;
    if (!endpoint || !project || !apiKey || !databaseId || !collectionId) {
      return NextResponse.json({ ok: false, error: "Missing Appwrite env or APPWRITE_API_KEY" }, { status: 500 });
    }

    const headers = {
      "X-Appwrite-Project": String(project),
      "X-Appwrite-Key": String(apiKey),
      "content-type": "application/json",
    } as const;

    // Fetch collection schema
    const colRes = await fetch(`${endpoint}/databases/${databaseId}/collections/${collectionId}`, { headers, cache: "no-store" });
    if (!colRes.ok) {
      return NextResponse.json({ ok: false, error: `Failed to fetch collection: HTTP ${colRes.status}` }, { status: 500 });
    }
    const col = await colRes.json();
    const attrs: any[] = col?.attributes ?? [];
    const has = (key: string) => attrs.some((a: any) => a.key === key || a.$id === key);

    const created: string[] = [];

    // Create string attributes for URLs if missing
    const ensureStringAttr = async (key: string, size = 2048) => {
      if (has(key)) return;
      const res = await fetch(`${endpoint}/databases/${databaseId}/collections/${collectionId}/attributes/string`, {
        method: "POST",
        headers,
        body: JSON.stringify({ key, size, required: false, default: null, array: false }),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`Failed to create attribute ${key}: HTTP ${res.status} ${txt}`);
      }
      created.push(key);
    };

    await ensureStringAttr("avatar_url");
    await ensureStringAttr("banner_url");

    return NextResponse.json({ ok: true, created });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}

