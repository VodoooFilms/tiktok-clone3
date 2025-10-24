"use client";
import { useMemo } from "react";
import { useUI } from "@/app/context/ui-context";

export default function ShareOverlay() {
  const { sharePostId, closeShare } = useUI();
  const open = Boolean(sharePostId);
  const shareUrl = useMemo(() => {
    if (!sharePostId) return "";
    try {
      if (typeof window === "undefined") return "";
      return `${window.location.origin}/post/${sharePostId}`;
    } catch {
      return "";
    }
  }, [sharePostId]);

  if (!open) return null;

  const canNativeShare = typeof window !== 'undefined' && !!(navigator as any)?.share;

  const handleCopy = async () => {
    try { await navigator.clipboard?.writeText(shareUrl); } catch {}
    closeShare();
  };

  const handleNative = async () => {
    try { await (navigator as any).share?.({ url: shareUrl }); } catch {}
    closeShare();
  };

  const openExternal = (url: string) => {
    try { window.open(url, '_blank', 'noopener,noreferrer'); } catch {}
    closeShare();
  };

  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex items-end justify-center md:items-center md:justify-center">
      <div className="pointer-events-auto absolute inset-0 bg-black/40" onClick={closeShare} />
      <div className="pointer-events-auto relative z-10 w-full max-w-sm rounded-t-2xl md:rounded-2xl border border-neutral-800 bg-neutral-950 p-4 shadow-2xl">
        <div className="mb-2 flex items-center justify-between">
          <div className="text-sm font-medium">Share</div>
          <button onClick={closeShare} aria-label="Close" className="rounded px-2 py-1 opacity-80 hover:opacity-100">×</button>
        </div>
        <div className="text-xs text-neutral-400 break-all mb-3">{shareUrl}</div>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={handleCopy} className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm hover:bg-neutral-800">Copy link</button>
          {canNativeShare && (
            <button onClick={handleNative} className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm hover:bg-neutral-800">Share via device</button>
          )}
          <button onClick={() => openExternal(`https://wa.me/?text=${encodeURIComponent(shareUrl)}`)} className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm hover:bg-neutral-800">WhatsApp</button>
          <button onClick={() => openExternal(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}`)} className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm hover:bg-neutral-800">X (Twitter)</button>
          <button onClick={() => openExternal(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}`)} className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm hover:bg-neutral-800">Telegram</button>
          <button onClick={() => openExternal(`mailto:?subject=${encodeURIComponent('Check this video')}&body=${encodeURIComponent(shareUrl)}`)} className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm hover:bg-neutral-800">Email</button>
        </div>
      </div>
    </div>
  );
}

