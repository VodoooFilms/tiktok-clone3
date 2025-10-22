"use client";
import { createContext, useContext, useMemo, useState } from "react";

type UIContextValue = {
  authOpen: boolean;
  editProfileOpen: boolean;
  openAuth: () => void;
  closeAuth: () => void;
  openEditProfile: () => void;
  closeEditProfile: () => void;
};

const UIContext = createContext<UIContextValue | null>(null);

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [authOpen, setAuthOpen] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);

  const value = useMemo<UIContextValue>(
    () => ({
      authOpen,
      editProfileOpen,
      openAuth: () => setAuthOpen(true),
      closeAuth: () => setAuthOpen(false),
      openEditProfile: () => setEditProfileOpen(true),
      closeEditProfile: () => setEditProfileOpen(false),
    }),
    [authOpen, editProfileOpen]
  );

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export const useUI = () => {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error("useUI must be used within UIProvider");
  return ctx;
};

