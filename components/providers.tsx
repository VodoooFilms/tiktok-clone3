"use client";
import { UIProvider } from "@/app/context/ui-context";
import { UserProvider } from "@/app/context/user";
import { ProfileSetupProvider } from "@/app/context/profile-setup";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <UIProvider>
      <UserProvider>
        <ProfileSetupProvider>{children}</ProfileSetupProvider>
      </UserProvider>
    </UIProvider>
  );
}
