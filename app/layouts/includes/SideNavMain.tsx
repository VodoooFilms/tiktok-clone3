export default function SideNavMain() {
  return (
    <aside className="hidden md:block w-64 shrink-0 border-r p-4">
      <div className="mb-4 text-sm font-medium text-muted-foreground">Menu</div>
      <nav className="flex flex-col gap-2">
        <a href="/" className="px-2 py-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-900">For You</a>
        <a href="/upload" className="px-2 py-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-900">Upload</a>
      </nav>
    </aside>
  );
}

