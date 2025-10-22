"use client";
import { useUI } from "@/app/context/ui-context";
import { useUser } from "@/app/context/user";
import { account } from "@/libs/AppWriteClient";
import { OAuthProvider } from "appwrite";

function getRedirectURL() {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (envUrl && envUrl.length) return envUrl;
  if (typeof window !== "undefined") return window.location.origin;
  return "http://localhost:3000";
}

export default function AuthOverlay() {
  const { authOpen, closeAuth } = useUI();
  const { user, loading, loginAnonymous, logout } = useUser();
  if (!authOpen) return null;

  const loginWithGoogle = async () => {
    const redirect = getRedirectURL();
    await account.createOAuth2Session(OAuthProvider.Google, redirect, `${redirect}?auth=failed`);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={closeAuth}
    >
      <div
        className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-lg font-semibold">{user ? "Account" : "Log in"}</h2>

        {user ? (
          <div className="mb-4 text-sm text-neutral-700">
            <p className="mb-1">Signed in</p>
            <p className="text-neutral-500 break-all">{user.email || user.name || user.$id}</p>
          </div>
        ) : (
          <p className="mb-4 text-sm text-neutral-600">Choose a method to continue.</p>
        )}

        <div className="flex flex-col gap-2">
          {!user && (
            <>
              <button
                className="rounded bg-black px-3 py-2 text-white"
                onClick={async () => {
                  await loginAnonymous();
                  closeAuth();
                }}
                disabled={loading}
              >
                Continue as guest
              </button>
              <button className="rounded border px-3 py-2" onClick={loginWithGoogle}>
                Continue with Google
              </button>
            </>
          )}

          {user && (
            <button
              className="rounded border px-3 py-2"
              onClick={async () => {
                await logout();
                closeAuth();
              }}
            >
              Log out
            </button>
          )}

          <button className="rounded px-3 py-2" onClick={closeAuth}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
