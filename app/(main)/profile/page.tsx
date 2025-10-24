"use client";
import MainLayout from "@/app/layouts/MainLayout";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useUser } from "@/app/context/user";
import { useUI } from "@/app/context/ui-context";

export default function MyProfileEntry() {
  const { user, loading } = useUser();
  const { openAuth } = useUI();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace(`/profile/${user.$id}`);
    }
  }, [user, loading, router]);

  return (
    <MainLayout>
      <section className="p-6">
        {!loading && !user && (
          <div className="max-w-md rounded border border-neutral-800 p-4">
            <h1 className="mb-2 text-lg font-semibold">Sign in to view your profile</h1>
            <p className="mb-3 text-sm text-neutral-400">Your profile shows your posts and followers.</p>
            <button className="rounded bg-black px-3 py-2 text-white" onClick={openAuth}>Log in</button>
          </div>
        )}
      </section>
    </MainLayout>
  );
}

