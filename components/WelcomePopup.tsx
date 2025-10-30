"use client";
import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";

type WelcomePopupProps = {
  onClose: () => void;
};

export default function WelcomePopup({ onClose }: WelcomePopupProps) {
  const [visible, setVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    // trigger fade-in
    const id = requestAnimationFrame(() => setVisible(true));
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  const onOverlayClick: React.MouseEventHandler<HTMLDivElement> = (e) => {
    // close only if clicking outside the card
    if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  return (
    <div
      className={[
        "fixed inset-0 z-50 flex items-center justify-center",
        "bg-black/60 backdrop-blur-md",
        "transition-opacity duration-500",
        visible ? "opacity-100" : "opacity-0",
      ].join(" ")}
      onMouseDown={onOverlayClick}
    >
      {/* Gradient border wrapper */}
      <div className="mx-4 w-full max-w-md">
        <div className="relative rounded-2xl p-[1px] bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-violet-500 shadow-lg">
          <div
            ref={cardRef}
            onMouseDown={(e) => e.stopPropagation()}
            className="rounded-2xl bg-[#0a0a0a]/90 px-8 py-10 text-center"
          >
            {/* Top heading */}
            <div className="mb-4 text-white/90 text-2xl md:text-3xl font-semibold tracking-tight">
              Welcome to
            </div>
            {/* Top illustration */}
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
            
            {/* Brand Logo (replaces text title) */}
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
            <h2 className="sr-only">YADDAI — AI Video Playground</h2>
            {/* Subtitle */}
            <p className="hidden mt-2 text-sm leading-relaxed text-violet-200/70">
              Yaddai is a space for creators exploring the edge of art and technology. We use AI responsibly to craft new stories and new characters, and original worlds — always with respect for creativity, copyright, and the people behind great ideas.
            </p>
            <p className="mt-2 text-sm leading-relaxed text-violet-200/70">
              Yaddai is a space for entertainment and AI creation. We share and use artificial intelligence responsibly to craft new stories and new characters — always with respect for creativity, copyright, and the people behind great ideas.
            </p>

            {/* Actions */}
            <div className="mt-6 flex items-center justify-center gap-3">
              {/* Try the Beta (gradient border) */}
              <div className="rounded-lg p-[1px] bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-violet-500">
                <button
                  type="button"
                  className="rounded-lg bg-transparent px-4 py-2 text-sm text-white/90 hover:text-white transition-shadow duration-200 hover:shadow-[0_0_24px_rgba(168,85,247,0.35)]"
                  onClick={onClose}
                >
                  Try the Beta
                </button>
              </div>

              {/* Continue with Google */}
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-4 py-2 text-sm text-white/90 hover:border-white/40 hover:text-white transition-colors"
                onClick={onClose}
              >
                <GoogleIcon className="h-4 w-4" />
                Continue with Google
              </button>
            </div>

            {/* Continue as guest */}
            <button
              type="button"
              className="mt-3 text-xs text-neutral-400 hover:underline"
              onClick={onClose}
            >
              or continue as guest
            </button>

            {/* Footer */}
            <p className="hidden">
              © 2025 Yaddai — Private Beta
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon({ className = "" }: { className?: string }) {
  // Minimal Google "G" SVG mark
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
