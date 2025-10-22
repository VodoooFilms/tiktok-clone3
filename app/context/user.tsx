"use client";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Models } from "appwrite";
import { account } from "@/libs/AppWriteClient";

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

  const refresh = async () => {
    try {
      const me = await account.get();
      setUser(me as AppwriteUser);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const loginAnonymous = async () => {
    try {
      await account.createAnonymousSession();
      await refresh();
    } catch (err) {
      console.error("Anonymous login failed", err);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await account.deleteSession("current");
    } finally {
      await refresh();
    }
  };

  useEffect(() => {
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

