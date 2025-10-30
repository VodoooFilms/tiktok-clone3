"use client";
import MainLayout from "@/app/layouts/MainLayout";
import PostCard from "@/components/post-card";
import { usePosts } from "@/lib/hooks/usePosts";
import React, { useEffect, useState } from "react";
import WelcomePopup from "@/components/WelcomePopup";

export default function Home() {
  const { posts, loading } = usePosts();
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    try {
      const seen = typeof window !== "undefined" && localStorage.getItem("yaddai_welcome_seen");
      if (!seen) setShowWelcome(true);
    } catch {
      // ignore storage failures
    }
  }, []);

  const handleCloseWelcome = () => {
    try {
      localStorage.setItem("yaddai_welcome_seen", "true");
    } catch {
      // ignore storage failures
    }
    setShowWelcome(false);
  };
  return (
    <MainLayout>
      {showWelcome && <WelcomePopup onClose={handleCloseWelcome} />}
      <section className="w-full snap-y snap-mandatory md:snap-none space-y-3">
        {loading && <p className="p-4 text-sm text-neutral-500">Loading…</p>}
        {!loading && posts.length === 0 && (
          <p className="p-4 text-sm text-neutral-500">No posts yet.</p>
        )}
        {!loading && posts.map((doc) => <PostCard key={doc.$id} doc={doc} />)}
      </section>
    </MainLayout>
  );
}
