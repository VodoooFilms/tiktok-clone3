import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_URL || process.env.NEXT_PUBLIC_ENDPOINT;
  const project = process.env.NEXT_PUBLIC_APPWRITE_PROJECT;
  const apiKey = process.env.APPWRITE_API_KEY;
  const dbId = process.env.NEXT_PUBLIC_DATABASE_ID as string | undefined;
  const colProfile = process.env.NEXT_PUBLIC_COLLECTION_ID_PROFILE as string | undefined;

  if (!endpoint || !project) {
    return NextResponse.json({ ok: false, error: "Missing endpoint/project env" }, { status: 500 });
  }
  if (!apiKey) {
    return NextResponse.json({ ok: false, error: "Server missing APPWRITE_API_KEY" }, { status: 401 });
  }
  if (!dbId || !colProfile) {
    return NextResponse.json({ ok: false, error: "Missing DB or Collection env" }, { status: 500 });
  }

  try {
    // 1) Get current account using the incoming cookies
    const cookieHeader = req.headers.get("cookie") || "";
    const meRes = await fetch(`${endpoint}/account`, {
      method: "GET",
      headers: {
        "X-Appwrite-Project": String(project),
        "cookie": cookieHeader,
      },
      cache: "no-store",
    });
    if (meRes.status === 401) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    if (!meRes.ok) {
      const j = await meRes.json().catch(() => ({}));
      return NextResponse.json({ ok: false, error: j?.message || `HTTP ${meRes.status}` }, { status: meRes.status });
    }
    const me = await meRes.json();
    const userId = me?.$id as string | undefined;
    const email = me?.email as string | undefined;
    const name = (me?.name as string | undefined) || userId || "";
    if (!userId) {
      return NextResponse.json({ ok: false, error: "No user id" }, { status: 400 });
    }
    // We only auto-create for non-anonymous users (heuristic: must have email)
    if (!email) {
      return NextResponse.json({ ok: true, created: false, reason: "anonymous-session" });
    }

    // 2) Check if profile exists
    const getRes = await fetch(`${endpoint}/databases/${dbId}/collections/${colProfile}/documents/${userId}`, {
      method: "GET",
      headers: {
        "X-Appwrite-Project": String(project),
        "X-Appwrite-Key": apiKey,
      },
      cache: "no-store",
    });
    if (getRes.ok) {
      return NextResponse.json({ ok: true, created: false, existed: true });
    }
    if (getRes.status !== 404) {
      const j = await getRes.json().catch(() => ({}));
      return NextResponse.json({ ok: false, error: j?.message || `HTTP ${getRes.status}` }, { status: getRes.status });
    }

    // 3) Inspect collection attributes (optional) to choose keys
    let idKey: string | null = null;
    let firstKey: string | null = null;
    let lastKey: string | null = null;
    let nameKey: string | null = null;
    try {
      const schemaRes = await fetch(`${endpoint}/databases/${dbId}/collections/${colProfile}`, {
        method: "GET",
        headers: {
          "X-Appwrite-Project": String(project),
          "X-Appwrite-Key": apiKey,
        },
        cache: "no-store",
      });
      if (schemaRes.ok) {
        const json = await schemaRes.json();
        const attrs: any[] = json?.attributes ?? [];
        const has = (n: string) => attrs.some((a: any) => a.key === n || a.$id === n);
        idKey = has("userid") ? "userid" : has("userId") ? "userId" : has("user_id") ? "user_id" : null;
        firstKey = has("firstName") ? "firstName" : null;
        lastKey = has("lastName") ? "lastName" : null;
        nameKey = has("name") ? "name" : null;
      }
    } catch {}

    // 4) Create profile document
    const payload: any = {};
    if (idKey) payload[idKey] = userId;
    if (nameKey) payload[nameKey] = name || userId;
    if (firstKey) payload[firstKey] = name || userId;
    if (lastKey) payload[lastKey] = "";

    const perms = [
      { type: "read", role: "any" },
      { type: "update", role: `user:${userId}` },
      { type: "delete", role: `user:${userId}` },
    ];

    const createRes = await fetch(`${endpoint}/databases/${dbId}/collections/${colProfile}/documents`, {
      method: "POST",
      headers: {
        "X-Appwrite-Project": String(project),
        "X-Appwrite-Key": apiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({ documentId: userId, data: payload, permissions: perms }),
    });
    if (!createRes.ok) {
      const j = await createRes.json().catch(() => ({}));
      return NextResponse.json({ ok: false, error: j?.message || `HTTP ${createRes.status}` }, { status: createRes.status });
    }
    return NextResponse.json({ ok: true, created: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}

