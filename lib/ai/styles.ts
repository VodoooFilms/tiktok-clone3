export type AvatarStyle = {
  id: string;
  title: string;
  prompt: string;
};

// Three simple, distinct styles for avatar generation
export const STYLES: AvatarStyle[] = [
  {
    id: "manga",
    title: "Manga",
    prompt:
      "Keep the same person and pose. Render as high-contrast manga illustration: inky lines, screen tones, clean halftones, minimal background, expressive eyes, crisp outlines.",
  },
  {
    id: "bw-horror",
    title: "B/W Horror",
    prompt:
      "Keep the same person and pose. Stylize as black-and-white horror portrait: harsh lighting, deep shadows, film grain, high contrast, eerie atmosphere, dramatic vignette.",
  },
  {
    id: "minecraft",
    title: "Cubic 3D",
    prompt:
      "Keep the same person and pose. Transform into a cubic voxel (Minecraft-like) 3D character: blocky geometry, flat colors, simple shading, square head and features, centered portrait.",
  },
];
