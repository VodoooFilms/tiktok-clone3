"use client";
import { UIProvider } from "@/app/context/ui-context";
import { UserProvider } from "@/app/context/user";
import { AuthProvider } from "@/app/context/auth-context";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <UIProvider>
      <AuthProvider>
        <UserProvider>{children}</UserProvider>
      </AuthProvider>
    </UIProvider>
  );
}
