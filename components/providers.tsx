"use client";
import { UIProvider } from "@/app/context/ui-context";
import { UserProvider } from "@/app/context/user";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <UIProvider>
      <UserProvider>{children}</UserProvider>
    </UIProvider>
  );
}
