import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // sharp is a native dep used in route handlers; keep it external to the bundle.
  serverExternalPackages: ["sharp", "postgres"],
};

export default nextConfig;
