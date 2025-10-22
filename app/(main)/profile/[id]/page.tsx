import MainLayout from "@/app/layouts/MainLayout";
import { notFound } from "next/navigation";
import ProfileActions from "@/components/profile-actions";

export default function ProfilePage({ params }: { params: { id: string } }) {
  const { id } = params;
  if (!id) return notFound();
  return (
    <MainLayout>
      <section className="w-full p-4">
        <div className="flex items-center gap-4">
          <div className="h-20 w-20 rounded-full bg-neutral-200" />
          <div>
            <h1 className="text-xl font-semibold">@user_{id}</h1>
            <p className="text-sm text-neutral-600">Bio goes here</p>
          </div>
        </div>
        <ProfileActions />
      </section>
    </MainLayout>
  );
}
