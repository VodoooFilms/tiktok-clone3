import Link from "next/link";
import { IconHome, IconUsers, IconUserCircle, IconPlus } from "@/components/icons";

export default function SideNavMain() {
  return (
    <aside className="hidden md:flex fixed left-0 top-16 h-[calc(100vh-64px)] w-60 p-4 flex-col">
      <nav className="flex flex-col gap-1 text-sm">
        <Link href="/" className="flex items-center gap-2 px-3 py-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-900">
          <IconHome className="h-5 w-5" />
          <span>For You</span>
        </Link>
        <Link href="/following" className="flex items-center gap-2 px-3 py-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-900">
          <IconUsers className="h-5 w-5" />
          <span>Following</span>
        </Link>
        <Link href="/profile" className="flex items-center gap-2 px-3 py-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-900">
          <IconUserCircle className="h-5 w-5" />
          <span>My Profile</span>
        </Link>
        <Link href="/upload" className="flex items-center gap-2 px-3 py-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-900">
          <IconPlus className="h-5 w-5" />
          <span>Upload</span>
        </Link>
      </nav>
    </aside>
  );
}

