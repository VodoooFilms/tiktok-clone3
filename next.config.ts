import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  experimental: {
    // Allow server code to import native Node libs used by GCS SDK
    serverComponentsExternalPackages: ["@google-cloud/storage"],
  },
  // Ensure Next picks this project as workspace root when multiple lockfiles exist
  turbopack: {
    // Use the current dir as the root for builds/dev
    root: __dirname,
  },
};

export default nextConfig;
