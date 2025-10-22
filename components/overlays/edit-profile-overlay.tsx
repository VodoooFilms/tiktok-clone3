"use client";
import { useUI } from "@/app/context/ui-context";

export default function EditProfileOverlay() {
  const { editProfileOpen, closeEditProfile } = useUI();
  if (!editProfileOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={closeEditProfile}>
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-4 text-lg font-semibold">Edit Profile</h2>
        <form className="flex flex-col gap-3">
          <label className="text-sm">
            Name
            <input className="mt-1 w-full rounded border px-3 py-2" placeholder="Your name" />
          </label>
          <label className="text-sm">
            Bio
            <textarea className="mt-1 w-full rounded border px-3 py-2" placeholder="Your bio" rows={3} />
          </label>
          <div className="mt-2 flex justify-end gap-2">
            <button type="button" className="rounded border px-3 py-2" onClick={closeEditProfile}>Cancel</button>
            <button type="submit" className="rounded bg-black px-3 py-2 text-white">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}

