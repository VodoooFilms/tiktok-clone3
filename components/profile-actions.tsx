"use client";
import { useUI } from "@/app/context/ui-context";

export default function ProfileActions() {
  const { openEditProfile } = useUI();
  return (
    <div className="flex items-center gap-2">
      <a
        href="/"
        className="inline-flex h-9 items-center rounded-lg border border-white/20 px-4 text-sm text-white/90 hover:border-white/40 hover:text-white"
      >
        Share
      </a>
      <button
        className="inline-flex h-9 items-center rounded-lg bg-black px-4 text-sm text-white hover:bg-neutral-900"
        onClick={openEditProfile}
      >
        Edit profile
      </button>
    </div>
  );
}

