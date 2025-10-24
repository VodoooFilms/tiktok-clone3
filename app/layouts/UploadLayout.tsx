import TopNav from "./includes/TopNav";
import SideNavMain from "./includes/SideNavMain";

export default function UploadLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <TopNav />
      {/* Match main layout spacing and sidebar */}
      <div className="w-full pt-14 md:pt-16 md:pl-60">
        <SideNavMain />
        <main className="min-h-screen">{children}</main>
      </div>
    </>
  );
}
