import TopNav from "./includes/TopNav";

export default function UploadLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-black text-white">
      <TopNav />
      <div className="mx-auto w-full max-w-7xl px-2">{children}</div>
    </div>
  );
}
