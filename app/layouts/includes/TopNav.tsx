"use client";
import { useUI } from "@/app/context/ui-context";
import { useUser } from "@/app/context/user";

export default function TopNav() {
  const { openAuth } = useUI();
  const { user, logout } = useUser();
  return (
    <header className="sticky top-0 z-10 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-4 gap-4">
        <a href="/" className="font-semibold">TikTok Clone</a>
        <form action="#" className="hidden md:flex flex-1 max-w-xl">
          <input
            className="w-full rounded-full border px-4 py-1 text-sm bg-transparent"
            placeholder="Search accounts and videos"
          />
        </form>
        <nav className="flex items-center gap-2 text-sm">
          <a
            href={user ? "/upload" : "#"}
            onClick={(e) => {
              if (!user) {
                e.preventDefault();
                openAuth();
              }
            }}
            className="rounded border px-3 py-1 hover:bg-neutral-100 dark:hover:bg-neutral-900"
          >
            Upload
          </a>
          {!user ? (
            <button
              onClick={openAuth}
              className="rounded bg-black text-white px-3 py-1 dark:bg-white dark:text-black"
            >
              Log in
            </button>
          ) : (
            <>
              <a href={`/profile/${user.$id}`} className="rounded px-3 py-1">
                Profile
              </a>
              <button className="rounded border px-3 py-1" onClick={logout}>
                Log out
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
