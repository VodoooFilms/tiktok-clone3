"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { account } from "@/lib/appwrite";
import { database, ID, Permission, Role } from "@/libs/AppWriteClient";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        // Ensure Appwrite session is established and fetch user
        const me = await account.get();
        const userId = me.$id;

        const databaseId = process.env.NEXT_PUBLIC_DATABASE_ID as string;
        const collectionId = process.env.NEXT_PUBLIC_COLLECTION_ID_PROFILE as string;

        let createdNew = false;
        try {
          await database.getDocument(databaseId, collectionId, userId);
        } catch {
          // Create minimal profile for first-time users
          const payload: Record<string, any> = {
            name: me.name,
            email: (me as any).email ?? "",
          };
          const perms = [
            Permission.read(Role.any()),
            Permission.update(Role.user(userId)),
            Permission.delete(Role.user(userId)),
          ];
          await database.createDocument(databaseId, collectionId, ID.custom(userId), payload, perms as any);
          createdNew = true;
        }

        // Redirect based on first-time vs returning
        if (createdNew) {
          router.replace("/profile/setup");
        } else {
          router.replace("/");
        }
      } catch (e) {
        // If anything goes wrong, send user to error page
        router.replace("/auth/error");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

