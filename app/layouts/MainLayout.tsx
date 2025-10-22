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
      <div className="mx-auto flex w-full max-w-7xl lg:px-2.5 px-0">
        <SideNavMain />
        <main className="min-h-screen flex-1">{children}</main>
      </div>
    </>
  );
}

