import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }, {
        protocol: "https",
        hostname: "ik.imagekit.io",
        pathname: "/devKartik/**",
      }],
  },
};

export default nextConfig;
