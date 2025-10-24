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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={closeAuth}
    >
      <div
        className="w-full max-w-sm rounded-xl bg-neutral-950 text-white p-6 shadow-xl ring-1 ring-neutral-800"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-lg font-semibold">{user && !loading ? "Account" : "Log in"}</h2>

        {user && !loading ? (
          <div className="mb-4 text-sm text-neutral-300">
            <p className="mb-1">Signed in</p>
            <p className="text-neutral-400 break-all">{user.email || user.name || user.$id}</p>
          </div>
        ) : (
          <p className="mb-4 text-sm text-neutral-300">{loading ? "Verifying session..." : "Choose a method to continue."}</p>
        )}

        <div className="flex flex-col gap-2">
          {(!user || loading) && (
            <>
              <button
                className="rounded bg-emerald-600 hover:bg-emerald-500 px-3 py-2 text-white"
                onClick={async () => {
                  await loginAnonymous();
                  closeAuth();
                }}
                disabled={loading}
              >
                Continue as guest
              </button>
              <button className="rounded border border-neutral-700 hover:bg-white/10 px-3 py-2" onClick={loginWithGoogle}>
                Continue with Google
              </button>
            </>
          )}

          {user && !loading && (
            <button
              className="rounded border border-neutral-700 hover:bg-white/10 px-3 py-2"
              onClick={async () => {
                await logout();
                closeAuth();
              }}
            >
              Log out
            </button>
          )}

          <button className="rounded px-3 py-2 text-neutral-300 hover:text-white hover:bg-white/10" onClick={closeAuth}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
