"use client";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Models } from "appwrite";
import { account, database, ID, Permission, Role } from "@/libs/AppWriteClient";
import { useRef } from "react";

type AppwriteUser = Models.User<Models.Preferences>;

type UserContextValue = {
  user: AppwriteUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
  loginAnonymous: () => Promise<void>;
  logout: () => Promise<void>;
};

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppwriteUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [storageWritable, setStorageWritable] = useState<boolean | null>(null);
  const CACHE_KEY = "aw:user";
  const ensuredProfileFor = useRef<string | null>(null);

  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_URL || process.env.NEXT_PUBLIC_ENDPOINT;
  const project = process.env.NEXT_PUBLIC_APPWRITE_PROJECT;
  const dbId = process.env.NEXT_PUBLIC_DATABASE_ID as string | undefined;
  const colProfile = process.env.NEXT_PUBLIC_COLLECTION_ID_PROFILE as string | undefined;

  const safeGet = (key: string) => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  };

  const safeSet = (key: string, value: string) => {
    try {
      // Probe that storage is writable (handles Safari private mode/quota errors)
      const probeKey = "__aw:probe";
      localStorage.setItem(probeKey, "1");
      localStorage.removeItem(probeKey);
      localStorage.setItem(key, value);
    } catch {
      // Swallow storage errors; caching is optional
    }
  };

  const safeRemove = (key: string) => {
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
  };

  const refresh = async () => {
    try {
      // Prefer REST when storage is blocked to avoid SDK localStorage fallback errors
      const me = await (async () => {
        if (storageWritable === false) {
          if (!endpoint || !project) throw new Error("Missing Appwrite env");
          const res = await fetch(`${endpoint}/account`, {
            credentials: "include",
            headers: { "X-Appwrite-Project": String(project) },
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return (await res.json()) as AppwriteUser;
        }
        try {
          return (await account.get()) as AppwriteUser;
        } catch (e: any) {
          // Fallback to REST if SDK chokes on localStorage
          if (!endpoint || !project) throw e;
          const res = await fetch(`${endpoint}/account`, {
            credentials: "include",
            headers: { "X-Appwrite-Project": String(project) },
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return (await res.json()) as AppwriteUser;
        }
      })();
      setUser(me as AppwriteUser);
      safeSet(
        CACHE_KEY,
        JSON.stringify({ $id: me.$id, name: me.name, email: (me as any).email ?? null })
      );
    } catch {
      setUser(null);
      safeRemove(CACHE_KEY);
    } finally {
      setLoading(false);
    }
  };

  const loginAnonymous = async () => {
    try {
      // Use REST path to avoid SDK's localStorage fallback
      if (!endpoint || !project) throw new Error("Missing Appwrite env");
      const res = await fetch(`${endpoint}/account/sessions/anonymous`, {
        method: "POST",
        credentials: "include",
        headers: { "X-Appwrite-Project": String(project), "content-type": "application/json" },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      // After session creation, fetch current user via REST or SDK fallback
      const me = await (async () => {
        if (storageWritable === false) {
          const r = await fetch(`${endpoint}/account`, {
            credentials: "include",
            headers: { "X-Appwrite-Project": String(project) },
          });
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return (await r.json()) as AppwriteUser;
        }
        try {
          // Also set header session on client, if present later
          const data: any = await account.get();
          return data as AppwriteUser;
        } catch {
          const r = await fetch(`${endpoint}/account`, {
            credentials: "include",
            headers: { "X-Appwrite-Project": String(project) },
          });
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return (await r.json()) as AppwriteUser;
        }
      })();
      setUser(me as AppwriteUser);
      safeSet(
        CACHE_KEY,
        JSON.stringify({ $id: me.$id, name: me.name, email: (me as any).email ?? null })
      );
    } catch (err) {
      console.error("Anonymous login failed", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (!endpoint || !project) throw new Error("Missing Appwrite env");
      const res = await fetch(`${endpoint}/account/sessions/current`, {
        method: "DELETE",
        credentials: "include",
        headers: { "X-Appwrite-Project": String(project) },
      });
      // ignore status body; SDK will pick up cleared cookies automatically
    } finally {
      await refresh();
    }
  };

  // Best-effort auto-creation of profile for newly logged-in users (non-anonymous)
  useEffect(() => {
    const ensure = async () => {
      if (!user || !user.$id) return;
      if (!dbId || !colProfile) return;
      if (ensuredProfileFor.current === user.$id) return;
      // Heuristic: skip anonymous users (most will not have an email)
      const isLikelyAnonymous = !(user as any).email;
      if (isLikelyAnonymous) return;
      // First, try server-side ensure (works even if collection is locked down)
      try {
        const r = await fetch("/api/profile/ensure", { method: "POST", cache: "no-store" });
        if (r.ok) {
          ensuredProfileFor.current = user.$id;
          try { window.dispatchEvent(new CustomEvent('profile:saved')); } catch {}
          return;
        }
      } catch {}
      // Fallback to client-side ensure via SDK
      try {
        // If doc exists, mark ensured
        await database.getDocument(String(dbId), String(colProfile), user.$id);
        ensuredProfileFor.current = user.$id;
        return;
      } catch {}
      // Try create with minimal payload and permissive read; only include known keys
      try {
        // Discover collection attributes via admin proxy (server will add API key)
        let idKey: string | null = null;
        let firstKey: string | null = null;
        let lastKey: string | null = null;
        let nameKey: string | null = null;
        try {
          const url = new URL(window.location.origin + "/api/admin/collection");
          url.searchParams.set("db", String(dbId));
          url.searchParams.set("col", String(colProfile));
          const res = await fetch(url.toString(), { cache: "no-store" });
          if (res.ok) {
            const json = await res.json();
            const attrs: any[] = json?.data?.attributes ?? [];
            const has = (n: string) => attrs.some((a: any) => a.key === n || a.$id === n);
            idKey = has("userid") ? "userid" : has("userId") ? "userId" : has("user_id") ? "user_id" : null;
            firstKey = has("firstName") ? "firstName" : null;
            lastKey = has("lastName") ? "lastName" : null;
            nameKey = has("name") ? "name" : null;
          }
        } catch {}
        const payload: any = {};
        if (idKey) payload[idKey] = user.$id;
        if (nameKey) payload[nameKey] = (user as any).name || user.$id;
        if (firstKey) payload[firstKey] = (user as any).name || user.$id;
        if (lastKey) payload[lastKey] = "";
        const perms = [
          Permission.read(Role.any()),
          Permission.update(Role.user(user.$id)),
          Permission.delete(Role.user(user.$id)),
        ];
        await database.createDocument(String(dbId), String(colProfile), ID.custom(user.$id), payload, perms as any);
        ensuredProfileFor.current = user.$id;
        try { window.dispatchEvent(new CustomEvent('profile:saved')); } catch {}
      } catch {}
    };
    ensure();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.$id]);

  useEffect(() => {
    // Patch localStorage.setItem to swallow quota errors (SDK cookieFallback writes)
    try {
      const ls: any = typeof window !== "undefined" ? window.localStorage : null;
      if (ls && typeof ls.setItem === "function") {
        const original = ls.setItem.bind(ls);
        ls.setItem = (key: string, value: string) => {
          try { original(key, value); } catch { /* ignore */ }
        };
      }
    } catch {}

    // Detect if storage is writable
    try {
      const probeKey = "__aw:probe";
      localStorage.setItem(probeKey, "1");
      localStorage.removeItem(probeKey);
      setStorageWritable(true);
    } catch {
      setStorageWritable(false);
    }

    // Optimistic hydrate from cache to avoid flicker between reloads
    const cached = safeGet(CACHE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setUser(parsed as AppwriteUser);
        // keep loading=true until backend verification completes
      } catch {
        // ignore corrupt cache
      }
    }
    // Always verify against backend
    refresh();

    // If returning from OAuth (code/state present), run an extra refresh soon after mount
    // to catch any deferred cookie propagation, then clean URL.
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.has("code") || url.searchParams.has("state")) {
        setTimeout(() => {
          refresh();
          try {
            url.searchParams.delete("code");
            url.searchParams.delete("state");
            url.searchParams.delete("scope");
            window.history.replaceState({}, "", url.toString());
          } catch {}
        }, 100);
      }
    } catch {}

    // Refresh on window focus/pageshow (useful after OAuth redirects, bfcache restores)
    const onFocus = () => { refresh(); };
    const onPageShow = () => { refresh(); };
    window.addEventListener("focus", onFocus);
    window.addEventListener("pageshow", onPageShow);

    // Also when tab becomes visible
    const onVisibility = () => { if (document.visibilityState === "visible") refresh(); };
    document.addEventListener("visibilitychange", onVisibility);

    // Cross-tab login/logout sync via storage events
    const onStorage = (e: StorageEvent) => {
      if (e.key === CACHE_KEY) refresh();
    };
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("pageshow", onPageShow);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("storage", onStorage);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo<UserContextValue>(
    () => ({ user, loading, refresh, loginAnonymous, logout }),
    [user, loading]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within UserProvider");
  return ctx;
}
