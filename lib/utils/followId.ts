// Lightweight deterministic ID helpers to avoid collisions
// Previous implementation truncated raw IDs to 12 chars which could collide.

// Simple fast 64-bit-ish hashing compressed into base36, 12 chars
export function hash12(input: string): string {
  let h1 = 0xdeadbeef ^ input.length;
  let h2 = 0x41c6ce57 ^ input.length;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = (h1 ^ (h1 >>> 16)) >>> 0;
  h2 = (h2 ^ (h2 >>> 16)) >>> 0;
  const x = (4294967296 * (h2 & 0x1fffff) + (h1 >>> 0)).toString(36);
  // Ensure fixed 12 chars
  return x.padStart(12, '0').slice(-12);
}

export function makeFollowDocId(followerId: string, followingId: string): string {
  const a = hash12(String(followerId));
  const b = hash12(String(followingId));
  return `f_${a}_${b}`; // length <= 1 + 12 + 1 + 12 = 26
}

