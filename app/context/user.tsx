"use client";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Models } from "appwrite";
import { account, client } from "@/libs/AppWriteClient";

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

  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_URL || process.env.NEXT_PUBLIC_ENDPOINT;
  const project = process.env.NEXT_PUBLIC_APPWRITE_PROJECT;

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
      // ignore status body
      try { client.setSession(""); } catch {}
    } finally {
      await refresh();
    }
  };

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
