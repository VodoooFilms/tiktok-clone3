import UploadLayout from "@/app/layouts/UploadLayout";

export default function UploadPage() {
  return (
    <UploadLayout>
      <section className="grid grid-cols-1 gap-6 p-4 md:grid-cols-2">
        <div>
          <div className="aspect-[9/16] w-full rounded border bg-neutral-50" />
        </div>
        <form className="flex flex-col gap-3">
          <label className="text-sm">
            Caption
            <input className="mt-1 w-full rounded border px-3 py-2" placeholder="Write a caption" />
          </label>
          <label className="text-sm">
            Video file
            <input type="file" accept="video/*" className="mt-1 w-full rounded border px-3 py-2" />
          </label>
          <div className="mt-2 flex gap-2">
            <button type="button" className="rounded border px-3 py-2">Discard</button>
            <button type="submit" className="rounded bg-black px-3 py-2 text-white">Post</button>
          </div>
          <p className="text-xs text-neutral-500">This is a static UI; wiring happens after AppWrite setup.</p>
        </form>
      </section>
    </UploadLayout>
  );
}
