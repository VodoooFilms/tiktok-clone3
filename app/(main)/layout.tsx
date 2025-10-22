import SideNav from "@/components/side-nav";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex w-full max-w-7xl">
      <SideNav />
      <main className="min-h-screen flex-1">{children}</main>
    </div>
  );
}

