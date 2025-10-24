"use client";
import TopNav from "./includes/TopNav";
import SideNavMain from "./includes/SideNavMain";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <TopNav />
      {/* Reserve space for fixed top nav and left sidebar on md+ */}
      <div className="w-full pt-14 md:pt-16 md:pl-60">
        <SideNavMain />
        <main className="min-h-screen">{children}</main>
      </div>
    </>
  );
}

