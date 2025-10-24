"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconHome, IconUsers, IconProfile, IconPlus } from "@/components/icons";

export default function SideNavMain() {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || (href !== "/" && pathname.startsWith(href));
  const baseItem = "flex items-center gap-2 px-3 py-2 rounded";
  const hoverItem = "hover:bg-neutral-100 dark:hover:bg-neutral-900";
  return (
    <aside className="hidden md:flex fixed left-0 top-16 h-[calc(100vh-64px)] w-60 p-4 flex-col">
      <nav className="flex flex-col gap-1 text-sm">
        <Link href="/" className={`${baseItem} ${isActive("/") ? "bg-neutral-200 dark:bg-neutral-800" : hoverItem}`}>
          <IconHome className="h-5 w-5" />
          <span>For You</span>
        </Link>
        <Link href="/following" className={`${baseItem} ${isActive("/following") ? "bg-neutral-200 dark:bg-neutral-800" : hoverItem}`}>
          <IconUsers className="h-5 w-5" />
          <span>Following</span>
        </Link>
        <Link href="/profile" className={`${baseItem} ${isActive("/profile") ? "bg-neutral-200 dark:bg-neutral-800" : hoverItem}`}>
          <IconProfile className="h-5 w-5" />
          <span>My Profile</span>
        </Link>
        <Link href="/upload" className={`${baseItem} ${isActive("/upload") ? "bg-neutral-200 dark:bg-neutral-800" : hoverItem}`}>
          <IconPlus className="h-5 w-5" />
          <span>Upload</span>
        </Link>
      </nav>
      <div className="mt-auto px-3 pt-3 text-xs text-neutral-500 dark:text-neutral-400 select-none">Yaddai 2025</div>
    </aside>
  );
}

