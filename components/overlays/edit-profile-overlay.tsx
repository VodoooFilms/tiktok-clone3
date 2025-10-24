"use client";
import { useUI } from "@/app/context/ui-context";
import { useUser } from "@/app/context/user";
import { database, storage, ID, Permission, Role } from "@/libs/AppWriteClient";
import { useEffect, useMemo, useState } from "react";

export default function EditProfileOverlay() {
  const { editProfileOpen, closeEditProfile } = useUI();
  const { user } = useUser();
  const [name, setName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const [bannerPreview, setBannerPreview] = useState<string>("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>("");

  const dbId = process.env.NEXT_PUBLIC_DATABASE_ID as string;
  const colProfile = process.env.NEXT_PUBLIC_COLLECTION_ID_PROFILE as string;
  const bucketId = process.env.NEXT_PUBLIC_BUCKET_ID as string;

  // Detect profile schema keys using admin API (server has APPWRITE_API_KEY)
  const [keys, setKeys] = useState<{ idKey: string | null; firstKey: string | null; lastKey: string | null; bioKey: string | null; descKey: string | null; avatarKey: string | null; bannerKey: string | null }>({ idKey: null, firstKey: null, lastKey: null, bioKey: null, descKey: null, avatarKey: null, bannerKey: null });
  useEffect(() => {
    (async () => {
      try {
        const url = new URL(window.location.origin + "/api/admin/collection");
        url.searchParams.set("db", String(dbId));
        url.searchParams.set("col", String(colProfile));
        const res = await fetch(url.toString(), { cache: "no-store" });
        if (!res.ok) return;
        const json = await res.json();
        const attrs: any[] = json?.data?.attributes ?? [];
        const has = (name: string) => attrs.some((a: any) => a.key === name || a.$id === name);
        setKeys({
          idKey: has("userid") ? "userid" : has("userId") ? "userId" : has("user_id") ? "user_id" : "userid",
          firstKey: has("firstName") ? "firstName" : null,
          lastKey: has("lastName") ? "lastName" : null,
          bioKey: has("bio") ? "bio" : null,
          descKey: has("description") ? "description" : null,
          avatarKey: has("avatar_file_id") ? "avatar_file_id" : has("avatarId") ? "avatarId" : has("avatar") ? "avatar" : null,
          bannerKey: has("banner_file_id") ? "banner_file_id" : has("bannerId") ? "bannerId" : has("banner") ? "banner" : null,
        });
      } catch {}
    })();
  }, [dbId, colProfile]);

  useEffect(() => {
    if (!editProfileOpen) return;
    setError("");
    // Attempt to preload existing profile; ignore if not found
    (async () => {
      try {
        if (!user) return;
        const d = await database.getDocument(dbId, colProfile, user.$id);
        const any: any = d;
        setName(String(any.name ?? ""));
        setFirstName(String(any.firstName ?? ""));
        setLastName(String(any.lastName ?? ""));
        setBio(String(any.bio ?? any.description ?? ""));
        const avatarId = any.avatar_file_id || any.avatarId || any.avatar || any.avatar_fileId;
        const bannerId = any.banner_file_id || any.bannerId || any.banner || any.banner_fileId;
        try { if (avatarId) setAvatarPreview(storage.getFileView(String(bucketId), String(avatarId)).toString()); } catch {}
        try { if (bannerId) setBannerPreview(storage.getFileView(String(bucketId), String(bannerId)).toString()); } catch {}
      } catch {}
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editProfileOpen, user?.$id]);

  if (!editProfileOpen) return null;

  const onFile = (setterFile: (f: File|null) => void, setterPreview: (s: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setterFile(f);
    if (f) {
      const url = URL.createObjectURL(f);
      setterPreview(url);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    setError("");
    try {
      // Upload files if provided
      let avatarId: string | undefined;
      let bannerId: string | undefined;
      // File permissions: public read so avatars/banners are visible
      const filePerms = [
        Permission.read(Role.any()),
        Permission.update(Role.user(user.$id)),
        Permission.delete(Role.user(user.$id)),
      ];
      if (avatarFile) {
        const up = await storage.createFile(String(bucketId), ID.unique(), avatarFile, filePerms as any);
        avatarId = String((up as any).$id);
      }
      if (bannerFile) {
        const up = await storage.createFile(String(bucketId), ID.unique(), bannerFile, filePerms as any);
        bannerId = String((up as any).$id);
      }

      const perms = [
        Permission.read(Role.any()),
        Permission.update(Role.user(user.$id)),
        Permission.delete(Role.user(user.$id)),
      ];
      // Only send keys that exist in collection (avoid unknown attribute errors)
      let payload: any = {};
      const idKey = keys.idKey || "userid";
      payload[idKey] = user.$id;
      const fn = firstName.trim();
      const ln = lastName.trim();
      if (keys.firstKey && (fn || true)) payload[keys.firstKey] = fn || user.$id; // required on some schemas
      if (keys.lastKey && ln) payload[keys.lastKey] = ln;
      const bioTrim = bio.trim();
      if (keys.bioKey && bioTrim) payload[keys.bioKey] = bioTrim;
      if (keys.descKey && bioTrim) payload[keys.descKey] = bioTrim;
      if (avatarId && keys.avatarKey) payload[keys.avatarKey] = avatarId;
      if (bannerId && keys.bannerKey) payload[keys.bannerKey] = bannerId;

      // Try upsert: create with deterministic ID, then fallback to update on conflict
      try {
        await database.createDocument(String(dbId), String(colProfile), ID.custom(user.$id), payload, perms as any);
      } catch (err: any) {
        const msg = String(err?.message || err || "").toLowerCase();
        if (err?.code === 409 || msg.includes("already exists")) {
          // update existing
          try {
            await database.updateDocument(String(dbId), String(colProfile), user.$id, payload, perms as any);
          } catch (err2: any) { throw err2; }
        } else if (/unknown attribute/i.test(msg)) {
          // Re-detect and retry with only allowed keys
          try {
            const url = new URL(window.location.origin + "/api/admin/collection");
            url.searchParams.set("db", String(dbId));
            url.searchParams.set("col", String(colProfile));
            const r = await fetch(url.toString(), { cache: "no-store" });
            const j = await r.json();
            const attrs: any[] = j?.data?.attributes ?? [];
            const has = (name: string) => attrs.some((a: any) => a.key === name || a.$id === name);
            const clean: any = {};
            const idKey2 = has("userid") ? "userid" : has("userId") ? "userId" : has("user_id") ? "user_id" : "userid";
            clean[idKey2] = user.$id;
            if (has("firstName")) clean["firstName"] = fn || user.$id;
            if (has("lastName") && ln) clean["lastName"] = ln;
            if (has("bio") && bioTrim) clean["bio"] = bioTrim;
            if (has("description") && bioTrim) clean["description"] = bioTrim;
            if (avatarId && (has("avatar_file_id") || has("avatarId") || has("avatar"))) {
              clean[has("avatar_file_id") ? "avatar_file_id" : has("avatarId") ? "avatarId" : "avatar"] = avatarId;
            }
            if (bannerId && (has("banner_file_id") || has("bannerId") || has("banner"))) {
              clean[has("banner_file_id") ? "banner_file_id" : has("bannerId") ? "bannerId" : "banner"] = bannerId;
            }
            await database.createDocument(String(dbId), String(colProfile), ID.custom(user.$id), clean, perms as any);
          } catch (ie) { throw ie; }
        } else {
          throw err;
        }
      }
      try { window.dispatchEvent(new CustomEvent('profile:saved')); } catch {}
      closeEditProfile();
    } catch (e: any) {
      setError(String(e?.message || e || "Failed to save profile"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={closeEditProfile}>
      <div className="w-full max-w-lg rounded-xl bg-neutral-950 text-white p-0 shadow-xl ring-1 ring-neutral-800 overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Banner preview */}
        <div className="relative h-32 w-full bg-neutral-900">
          {bannerPreview && <img src={bannerPreview} alt="banner" className="h-full w-full object-cover" />}
          {/* Avatar over banner */}
          <div className="absolute -bottom-8 left-4 z-10 h-20 w-20 overflow-hidden rounded-full border-2 border-neutral-900 bg-neutral-800">
            {avatarPreview && <img src={avatarPreview} alt="avatar" className="h-full w-full object-cover" />}
          </div>
          <label className="absolute right-2 bottom-2 cursor-pointer rounded bg-white/10 px-2 py-1 text-xs text-white hover:bg-white/20">
            Change banner
            <input type="file" accept="image/*" className="hidden" onChange={onFile(setBannerFile, setBannerPreview)} />
          </label>
        </div>
        <div className="p-6 pt-12">
          {/* Change avatar action */}
          <div className="mb-3 pl-24">
            <label className="cursor-pointer rounded border border-neutral-700 px-2 py-1 text-xs hover:bg-white/10">
              Change photo
              <input type="file" accept="image/*" className="hidden" onChange={onFile(setAvatarFile, setAvatarPreview)} />
            </label>
          </div>
          <form className="flex flex-col gap-3" onSubmit={onSubmit}>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm">
                First name
                <input className="mt-1 w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2" placeholder="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </label>
              <label className="text-sm">
                Last name
                <input className="mt-1 w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2" placeholder="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </label>
            </div>
            <label className="text-sm">
              Bio
              <textarea className="mt-1 w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2" placeholder="Your bio" rows={3} value={bio} onChange={(e) => setBio(e.target.value)} />
            </label>
            {error && <div className="text-sm text-red-400">{error}</div>}
            <div className="mt-2 flex justify-end gap-2">
              <button type="button" className="rounded border border-neutral-700 px-3 py-2 hover:bg-white/10" onClick={closeEditProfile} disabled={busy}>Cancel</button>
              <button type="submit" className="rounded bg-emerald-600 px-3 py-2 text-white hover:bg-emerald-500 disabled:opacity-60" disabled={busy}>{busy ? "Saving..." : "Save"}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

