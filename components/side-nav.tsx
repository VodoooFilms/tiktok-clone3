export default function SideNav() {
  return (
    <aside className="h-screen w-64 border-r p-4 sticky top-0 hidden md:block">
      <div className="mb-6 text-xl font-bold">TikTok Clone</div>
      <nav className="flex flex-col gap-2">
        <a href="/" className="px-2 py-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-900">Home</a>
        <a href="/upload" className="px-2 py-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-900">Upload</a>
        <a href="#" className="px-2 py-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-900">Profile</a>
      </nav>
    </aside>
  );
}

