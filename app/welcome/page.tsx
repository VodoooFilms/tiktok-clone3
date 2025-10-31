"use client";
import React from "react";
import Image from "next/image";
import Link from "next/link";

export default function WelcomePage() {
  return (
    <main className="min-h-screen w-full bg-black text-white flex items-center justify-center p-4">
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
                <Link
                  href="/"
                  className="rounded-lg bg-transparent px-4 py-2 text-sm text-white/90 hover:text-white transition-shadow duration-200 hover:shadow-[0_0_24px_rgba(168,85,247,0.35)]"
                >
                  Enter Yaddai
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

