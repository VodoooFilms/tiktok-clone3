export default function PostCard({ index = 1 }: { index?: number }) {
  return (
    <article className="flex gap-4 border-b p-4">
      <div className="h-40 w-28 shrink-0 rounded bg-neutral-200" />
      <div className="flex flex-1 flex-col">
        <div className="mb-1 flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-neutral-200" />
          <div className="h-4 w-24 rounded bg-neutral-200" />
        </div>
        <p className="text-sm">Sample post #{index} description placeholder text.</p>
        <div className="mt-auto flex gap-3 pt-2 text-sm opacity-70">
          <span>❤️ 0</span>
          <span>💬 0</span>
          <span>↗️ Share</span>
        </div>
      </div>
    </article>
  );
}

