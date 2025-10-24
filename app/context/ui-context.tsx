"use client";
import { createContext, useContext, useMemo, useState } from "react";

type UIContextValue = {
  authOpen: boolean;
  editProfileOpen: boolean;
  // Right-side comments panel
  commentsPostId: string | null;
  // Share bottom sheet
  sharePostId: string | null;
  openAuth: () => void;
  closeAuth: () => void;
  openEditProfile: () => void;
  closeEditProfile: () => void;
  openComments: (postId: string) => void;
  closeComments: () => void;
  openShare: (postId: string) => void;
  closeShare: () => void;
};

const UIContext = createContext<UIContextValue | null>(null);

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [authOpen, setAuthOpen] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [commentsPostId, setCommentsPostId] = useState<string | null>(null);
  const [sharePostId, setSharePostId] = useState<string | null>(null);

  const value = useMemo<UIContextValue>(
    () => ({
      authOpen,
      editProfileOpen,
      commentsPostId,
      sharePostId,
      openAuth: () => setAuthOpen(true),
      closeAuth: () => setAuthOpen(false),
      openEditProfile: () => setEditProfileOpen(true),
      closeEditProfile: () => setEditProfileOpen(false),
      openComments: (postId: string) => setCommentsPostId(postId),
      closeComments: () => setCommentsPostId(null),
      openShare: (postId: string) => setSharePostId(postId),
      closeShare: () => setSharePostId(null),
    }),
    [authOpen, editProfileOpen, commentsPostId, sharePostId]
  );

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export const useUI = () => {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error("useUI must be used within UIProvider");
  return ctx;
};
