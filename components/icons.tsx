import React from "react";

type Props = { className?: string };

export function IconHome({ className }: Props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M12 3l9 8h-3v10h-5V15H11v6H6V11H3l9-8z" />
    </svg>
  );
}

export function IconCompass({ className }: Props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm3.9 6.1l-2 5.8-5.8 2 2-5.8 5.8-2z" />
    </svg>
  );
}

export function IconUsers({ className }: Props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M16 11c1.7 0 3-1.3 3-3s-1.3-3-3-3-3 1.3-3 3 1.3 3 3 3zM8 11c1.7 0 3-1.3 3-3S9.7 5 8 5 5 6.3 5 8s1.3 3 3 3zm0 2c-2.7 0-8 1.4-8 4v2h10v-2c0-1.8.9-3.1 2.2-4-1.1-.6-2.7-1-4.2-1zm8 0c-2.2 0-6 1.2-6 3v3h12v-3c0-1.8-3.8-3-6-3z" />
    </svg>
  );
}

export function IconUserCircle({ className }: Props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 5a3 3 0 110 6 3 3 0 010-6zm0 8c-2.7 0-5 1.3-5 3v1h10v-1c0-1.7-2.3-3-5-3z" />
    </svg>
  );
}

// New profile icon with clear head + shoulders silhouette (outline strokes)
export function IconProfile({ className }: Props) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="10" r="3" />
      <path d="M6 19c0-3.2 12-3.2 12 0" />
    </svg>
  );
}

export function IconPlus({ className }: Props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M11 11V5h2v6h6v2h-6v6h-2v-6H5v-2h6z" />
    </svg>
  );
}

export function IconSearch({ className }: Props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M10 2a8 8 0 105.3 14.1l4.3 4.3 1.4-1.4-4.3-4.3A8 8 0 0010 2zm0 2a6 6 0 110 12A6 6 0 0110 4z" />
    </svg>
  );
}

export function IconLogout({ className }: Props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M3 4h10a2 2 0 012 2v3h-2V6H5v12h8v-3h2v3a2 2 0 01-2 2H3a2 2 0 01-2-2V6a2 2 0 012-2z" />
      <path d="M14 12l-3-3 1.4-1.4L18.8 14l-6.4 6.4L11 19l3-3H7v-2h7z" />
    </svg>
  );
}

export function IconVolumeOn({ className }: Props) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M3 9v6h4l5 4V5L7 9H3z" />
      <path d="M16.5 12c0-1.77-1-3.29-2.5-4.03v8.06A4.5 4.5 0 0016.5 12z" />
      <path d="M14 3.23v2.06c3.39.49 6 3.39 6 6.71s-2.61 6.22-6 6.71v2.06c4.95-.51 8.5-4.59 8.5-8.77S18.95 3.74 14 3.23z" />
    </svg>
  );
}

export function IconVolumeOff({ className }: Props) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M3 9v6h4l5 4V5L7 9H3z" />
      <path d="M16 8l-1.4 1.4L17.2 12l-2.6 2.6L16 16l2.6-2.6 2.6 2.6 1.4-1.4L20 12l2.6-2.6-1.4-1.4L18.6 10.6 16 8z" />
    </svg>
  );
}

export default {};
