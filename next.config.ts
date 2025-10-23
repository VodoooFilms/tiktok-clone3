import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // Ensure Next picks this project as workspace root when multiple lockfiles exist
  turbopack: {
    // Use the current dir as the root for builds/dev
    root: __dirname,
  },
};

export default nextConfig;
