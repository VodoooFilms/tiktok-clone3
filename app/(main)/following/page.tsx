"use client";
import MainLayout from "@/app/layouts/MainLayout";
import PostCard from "@/components/post-card";
import { useUser } from "@/app/context/user";
import { useFollowingPosts } from "@/lib/hooks/useFollowingPosts";

export default function FollowingPage() {
  const { user, loading } = useUser();
  const { posts, loading: loadingPosts } = useFollowingPosts(user?.$id);
  const showLoginHint = !loading && !user;
  const showEmpty = !loading && !!user && !loadingPosts && posts.length === 0;
  return (
    <MainLayout>
      <section className="w-full snap-y snap-mandatory md:snap-none space-y-3">
        {showLoginHint && (
          <p className="p-4 text-sm text-neutral-500">Sign in to see posts from people you follow.</p>
        )}
        {!showLoginHint && loadingPosts && (
          <p className="p-4 text-sm text-neutral-500">Loading...</p>
        )}
        {showEmpty && (
          <p className="p-4 text-sm text-neutral-500">No posts from people you follow yet.</p>
        )}
        {!showLoginHint && !loadingPosts && posts.map((doc) => (
          <PostCard key={doc.$id} doc={doc as any} />
        ))}
      </section>
    </MainLayout>
  );
}
