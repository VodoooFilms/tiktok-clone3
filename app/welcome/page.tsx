"use client";
import React, { useEffect } from "react";
import Image from "next/image";
import { account } from "@/libs/AppWriteClient";
import { OAuthProvider } from "appwrite";
import { useUser } from "@/app/context/user";
import { useRouter } from "next/navigation";

export default function WelcomePage() {
  const { user, loading } = useUser();
  const router = useRouter();

  // If already signed in, skip landing
  useEffect(() => {
    if (!loading && user) {
      router.replace("/");
    }
  }, [user, loading, router]);

  // Mark landing as seen to prevent redirect loops even if localStorage is blocked
  useEffect(() => {
    try { window.localStorage.setItem('yaddai_seen_welcome_v1', '1'); } catch {}
    try { window.sessionStorage.setItem('yaddai_seen_welcome_session_v1', '1'); } catch {}
  }, []);
  const getRedirectURL = () => {
    if (typeof window !== "undefined") return window.location.origin;
    const envUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (envUrl && envUrl.length) {
      try {
        const withScheme = /^https?:\/\//i.test(envUrl) ? envUrl : `https://${envUrl}`;
        const u = new URL(withScheme);
        return u.origin;
      } catch {}
    }
    return "http://localhost:3000";
  };
  const loginWithGoogle = async () => {
    const origin = getRedirectURL();
    const success = origin;
    const failure = `${origin}?auth=failed`;
    await account.createOAuth2Session(OAuthProvider.Google, success, failure);
  };
  return (
    <main className="relative min-h-screen w-full text-white flex items-center justify-center p-4 overflow-hidden">
      {/* Decorative gradient background */}
      <div className="pointer-events-none absolute inset-0 -z-20 bg-gradient-to-br from-cyan-500/20 via-fuchsia-500/12 to-violet-600/20" />
      {/* Green ambient glow behind the card */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[60vh] w-[70vw] rounded-[48px] bg-emerald-500/35 blur-3xl" style={{ zIndex: -15 }} />
      {/* Semi-transparent dark overlay with blur (pretty landing effect) */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-black/50 backdrop-blur-md supports-[backdrop-filter]:bg-black/50" />
      <div className="w-full max-w-md">
        <div className="relative rounded-2xl p-[1px] bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-violet-500 shadow-xl">
          <div className="rounded-2xl bg-[#0a0a0a]/90 px-8 py-10 text-center">
            <div className="mb-4 text-white/90 text-2xl md:text-3xl font-semibold tracking-tight">
              Welcome to
            </div>
            <div className="flex w-full justify-center">
              <Image
                src="/images/lottieyaddai.png"
                alt="Yaddai character"
                width={240}
                height={240}
                className="h-auto w-28 md:w-32 lg:w-36 drop-shadow-[0_8px_24px_rgba(139,92,246,0.25)] select-none"
                priority
              />
            </div>
            <div className="flex w-full justify-center">
              <Image
                src="/images/yaddai-logo-white.png"
                alt="Yaddai"
                width={320}
                height={64}
                className="h-auto w-[136px] md:w-[154px] lg:w-[168px] select-none"
                priority
              />
            </div>
            <h2 className="sr-only">YADDAI - AI Video Playground</h2>
            <p className="mt-2 text-sm leading-relaxed text-violet-200/70">
              Yaddai is a space for entertainment and AI creation. We share and use artificial intelligence responsibly to craft new stories and new characters — always with respect for creativity, copyright, and the people behind great ideas.
            </p>

            <div className="mt-6 flex items-center justify-center gap-3">
              <div className="rounded-lg p-[1px] bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-violet-500">
                <button
                  onClick={loginWithGoogle}
                  className="inline-flex items-center gap-2 rounded-lg bg-transparent px-4 py-2 text-sm text-white/90 hover:text-white transition-shadow duration-200 hover:shadow-[0_0_24px_rgba(168,85,247,0.35)]"
                >
                  <GoogleIcon className="h-4 w-4" />
                  Continue with Google
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function GoogleIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303c-1.648 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.153 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.651-.389-3.917z"
      />
      <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.39 16.108 18.822 12.765 24 12.765c3.059 0 5.842 1.153 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
      <path fill="#4CAF50" d="M24 44c5.167 0 9.86-1.977 13.409-5.197l-6.198-5.238C29.047 35.706 26.64 36.735 24 36.735c-5.204 0-9.62-3.317-11.28-7.95l-6.531 5.03C9.508 39.556 16.227 44 24 44z" />
      <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.793 2.241-2.225 4.166-4.094 5.565l.003-.002 6.198 5.238C35.145 40.027 40 36 42.5 30.5c.994-2.33 1.611-4.9 1.611-7.417 0-1.341-.138-2.651-.389-3.917z" />
    </svg>
  );
}
