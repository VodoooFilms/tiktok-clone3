"use client";
import { useUI } from "@/app/context/ui-context";
import { useUser } from "@/app/context/user";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { IconPlus, IconLogout } from "@/components/icons";

export default function TopNav() {
  const { openAuth } = useUI();
  const { user, logout } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const isActive = (_href: string) => ""; // tabs removed
  return (
    <header className="fixed inset-x-0 top-0 z-20 w-full bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="relative flex w-screen items-center justify-between pl-4 pr-6 md:pr-10 gap-3 h-14 md:h-16">
        <Link
          href="/"
          className="flex items-center gap-2"
          aria-label="Home"
        >
          <img
            src="/images/yaddai-logo-white.png"
            alt="Yaddai"
            className="w-auto select-none h-4 md:h-6 lg:h-7 object-contain shrink-0"
            draggable={false}
            onError={(e) => {
              const img = e.currentTarget as HTMLImageElement;
              img.style.display = 'none';
              const fallback = img.nextElementSibling as HTMLElement | null;
              if (fallback) fallback.style.display = 'inline-block';
            }}
          />
          <span style={{ display: 'none' }} className="font-semibold tracking-tight text-base md:text-lg lg:text-xl">Yaddai</span>
        </Link>

        {/* Tabs removed */}
        <form action="#" className="hidden md:flex absolute left-1/2 -translate-x-1/2 w-[240px] sm:w-[280px] lg:w-[360px]">
          <input
            className="w-full rounded-full border px-3 py-1 text-sm bg-transparent"
            placeholder="Search accounts and videos"
            maxLength={32}
          />
        </form>
        <nav className="flex items-center gap-2 text-sm ml-auto">
          <a
            href={user ? "/upload" : "/welcome"}
            onClick={(e) => {
              if (!user) {
                // Let the link navigate to /welcome
                return;
              }
            }}
            className="rounded border px-3 py-1 hover:bg-neutral-100 dark:hover:bg-neutral-900 inline-flex items-center gap-1.5"
          >
            <IconPlus className="h-4 w-4" />
            Upload
          </a>
          {!user ? (
            <Link href="/welcome" className="rounded bg-black text-white px-3 py-1 dark:bg-white dark:text-black">Log in</Link>
          ) : (
            <>
              <button className="rounded border px-3 py-1 inline-flex items-center gap-1.5" onClick={logout}>
                <IconLogout className="h-4 w-4" />
                Log out
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
