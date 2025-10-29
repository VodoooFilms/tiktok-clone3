import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  experimental: {
    // Allow server code to import native Node libs used by GCS SDK
    serverComponentsExternalPackages: ["@google-cloud/storage"],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Keep heavy SDK out of server bundle; let it load at runtime
      config.externals = config.externals || [] as any;
      const externals = Array.isArray(config.externals) ? config.externals : [config.externals];
      externals.push("@google-cloud/storage");
      config.externals = externals;
    }
    return config;
  },
  // Ensure Next picks this project as workspace root when multiple lockfiles exist
  turbopack: {
    // Use the current dir as the root for builds/dev
    root: __dirname,
  },
};

export default nextConfig;
