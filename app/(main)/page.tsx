"use client";
import MainLayout from "@/app/layouts/MainLayout";
import PostCard from "@/components/post-card";
import { usePosts } from "@/lib/hooks/usePosts";
import React from "react";

export default function Home() {
  const { posts, loading } = usePosts();
  return (
    <MainLayout>
      <section className="w-full">
        {loading && <p className="p-4 text-sm text-neutral-500">Loading…</p>}
        {!loading && posts.length === 0 && (
          <p className="p-4 text-sm text-neutral-500">No posts yet.</p>
        )}
        {!loading && posts.map((doc) => <PostCard key={doc.$id} doc={doc} />)}
      </section>
    </MainLayout>
  );
}
