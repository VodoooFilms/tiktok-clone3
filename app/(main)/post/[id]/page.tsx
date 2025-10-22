import MainLayout from "@/app/layouts/MainLayout";
import { notFound } from "next/navigation";

export default function PostPage({ params }: { params: { id: string } }) {
  const { id } = params;
  if (!id) return notFound();
  return (
    <MainLayout>
      <section className="grid w-full grid-cols-1 gap-4 p-4 md:grid-cols-2">
        <div className="aspect-[9/16] w-full rounded bg-black/90" />
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-full bg-neutral-200" />
            <div>
              <h2 className="text-base font-semibold">@creator_{id}</h2>
              <p className="text-xs text-neutral-600">Some caption here...</p>
            </div>
          </div>
          <div className="mt-auto flex gap-3 text-sm opacity-70">
            <span>❤️ 0</span>
            <span>💬 0</span>
            <span>↗️ Share</span>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}

