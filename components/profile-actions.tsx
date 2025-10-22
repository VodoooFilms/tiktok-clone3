"use client";
import { useUI } from "@/app/context/ui-context";

export default function ProfileActions() {
  const { openEditProfile } = useUI();
  return (
    <div className="mt-4 flex gap-2">
      <a href="/" className="rounded border px-3 py-1">Share</a>
      <button className="rounded bg-black px-3 py-1 text-white" onClick={openEditProfile}>Edit profile</button>
    </div>
  );
}

