"use client";
import MainLayout from "@/app/layouts/MainLayout";
import { useUser } from "@/app/context/user";
import { useUI } from "@/app/context/ui-context";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { database } from "@/libs/AppWriteClient";

export default function ProfileSetupPage() {
  const { user, loading } = useUser();
  const { openAuth, openEditProfile } = useUI();
  const router = useRouter();
  const dbId = process.env.NEXT_PUBLIC_DATABASE_ID as string;
  const colProfile = process.env.NEXT_PUBLIC_COLLECTION_ID_PROFILE as string;

  useEffect(() => {
    (async () => {
      if (loading) return;
      if (!user) return;
      try {
        await database.getDocument(dbId, colProfile, user.$id);
        // Profile exists → skip setup
        router.replace("/");
      } catch {
        // No profile yet → open editor
        openEditProfile();
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.$id, loading]);

  return (
    <MainLayout>
      <section className="p-6">
        {!loading && !user && (
          <div className="max-w-md rounded border border-neutral-800 p-4">
            <h1 className="mb-2 text-lg font-semibold">Create your profile</h1>
            <p className="mb-3 text-sm text-neutral-400">Log in to upload a banner, choose a profile photo, and add a bio.</p>
            <button className="rounded bg-black px-3 py-2 text-white" onClick={openAuth}>Log in</button>
          </div>
        )}
        {!loading && user && (
          <div className="max-w-xl rounded border border-neutral-800 p-4">
            <h1 className="mb-2 text-lg font-semibold">Set up your profile</h1>
            <p className="mb-3 text-sm text-neutral-400">Use the editor to add a banner, profile picture, and a short bio.</p>
            <button className="rounded bg-emerald-600 px-3 py-2 text-white" onClick={openEditProfile}>Open editor</button>
          </div>
        )}
      </section>
    </MainLayout>
  );
}

