"use client";
import MainLayout from "@/app/layouts/MainLayout";
import PostCard from "@/components/post-card";
import { usePosts } from "@/lib/hooks/usePosts";
import React, { useEffect, useState } from "react";
import { useUser } from "@/app/context/user";
import { useRouter } from "next/navigation";
import WelcomePopup from "@/components/WelcomePopup";
import { shuffleArray } from "@/lib/utils/shuffle";
import { Models } from "appwrite";
import { isPlayablePost } from "@/lib/utils/posts";

export default function Home() {
  const { posts, loading } = usePosts();
  const { user } = useUser();
  const router = useRouter();
  const [shuffledPosts, setShuffledPosts] = useState<Models.Document[]>([]);
  const [showWelcome, setShowWelcome] = useState(false);

  // Show welcome overlay once for anonymous users (transparent over moving feed)
  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      if (user) { setShowWelcome(false); return; }
      const KEY = 'yaddai_seen_welcome_v1';
      const SKEY = 'yaddai_seen_welcome_session_v1';
      const seenLocal = (() => { try { return window.localStorage.getItem(KEY) === '1'; } catch { return false; } })();
      const seenSession = (() => { try { return window.sessionStorage.getItem(SKEY) === '1'; } catch { return false; } })();
      if (!seenLocal && !seenSession) {
        try { window.localStorage.setItem(KEY, '1'); } catch {}
        try { window.sessionStorage.setItem(SKEY, '1'); } catch {}
        setShowWelcome(true);
      }
    } catch {}
  }, [user]);

  // Randomize feed on load and when requested
  useEffect(() => {
    const filtered = posts.filter((p: any) => isPlayablePost(p));
    setShuffledPosts(shuffleArray(filtered));
  }, [posts]);

  useEffect(() => {
    const onShuffle = () => {
      if (!posts || posts.length === 0) return;
      const filtered = posts.filter((p: any) => isPlayablePost(p));
      setShuffledPosts(shuffleArray(filtered));
    };
    if (typeof window !== "undefined") {
      window.addEventListener("feed:shuffle", onShuffle as EventListener);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("feed:shuffle", onShuffle as EventListener);
      }
    };
  }, [posts]);

  // Removed manual trigger; welcome appears only on first visit
  return (
    <MainLayout>
      <section className="w-full snap-y snap-mandatory md:snap-none space-y-3">
        {loading && <p className="p-4 text-sm text-neutral-500">Loading…</p>}
        {!loading && shuffledPosts.length === 0 && (
          <p className="p-4 text-sm text-neutral-500">No posts yet.</p>
        )}
        {!loading && shuffledPosts.map((doc) => <PostCard key={doc.$id} doc={doc} />)}
      </section>
      {showWelcome && <WelcomePopup onClose={() => setShowWelcome(false)} />}
    </MainLayout>
  );
}
