import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      { hostname: "crests.football-data.org" },
      { hostname: "upload.wikimedia.org" },
    ],
  },
}

export default nextConfig
