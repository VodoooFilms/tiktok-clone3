"use client";
import MainLayout from "@/app/layouts/MainLayout";
import PostCard from "@/components/post-card";
import { usePosts } from "@/lib/hooks/usePosts";
import React, { useEffect, useState } from "react";
import WelcomePopup from "@/components/WelcomePopup";

export default function Home() {
  const { posts, loading } = usePosts();
  const [showWelcome, setShowWelcome] = useState(false);

  // Decide when to show the welcome popup (overlay version)
  useEffect(() => {
    try {
      // Explicit trigger set by clicking the Yaddai logo
      const force = typeof window !== "undefined" && sessionStorage.getItem("yaddai_force_welcome") === "1";
      if (force) {
        setShowWelcome(true);
        sessionStorage.removeItem("yaddai_force_welcome");
        return;
      }

      const navEntries = typeof performance !== "undefined" ? (performance.getEntriesByType("navigation") as PerformanceNavigationTiming[]) : [];
      const navType = navEntries && navEntries.length > 0 ? navEntries[0].type : (undefined as any);

      // Show on browser reload
      if (navType === "reload") {
        setShowWelcome(true);
        return;
      }

      // Show on first entry to the app at '/': history length usually 1
      if (typeof window !== "undefined" && window.location?.pathname === "/" && window.history.length <= 1) {
        setShowWelcome(true);
        return;
      }
    } catch {
      // If detection fails, fail closed (no popup on soft navs)
    }
  }, []);

  // Allow immediate trigger when clicking the logo while already on '/'
  useEffect(() => {
    const handler = () => setShowWelcome(true);
    if (typeof window !== "undefined") {
      window.addEventListener("yaddai:force-welcome", handler as EventListener);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("yaddai:force-welcome", handler as EventListener);
      }
    };
  }, []);
  return (
    <MainLayout>
      {showWelcome && <WelcomePopup onClose={() => setShowWelcome(false)} />}
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
