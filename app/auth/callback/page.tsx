"use client";
import { useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useUser } from "@/app/context/user";

export default function AuthCallbackPage() {
  const params = useSearchParams();
  const router = useRouter();
  const { user, loading, refresh } = useUser();

  const failed = useMemo(() => params.get("auth") === "failed", [params]);

  useEffect(() => {
    // Ensure we re-verify session once we land here
    refresh().catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!loading) {
      if (failed) {
        // Back to home and surface error via query
        router.replace("/?auth=failed");
      } else if (user) {
        // Go to profile if we have a user
        router.replace(`/profile/${user.$id}`);
      } else {
        // No session; go home
        router.replace("/");
      }
    }
  }, [failed, loading, user, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="rounded border border-neutral-800 px-4 py-3 text-sm text-neutral-300">
        Completing sign-in…
      </div>
    </div>
  );
}

