/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client", "argon2", "@electric-sql/pglite", "pglite-prisma-adapter"],
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn.discordapp.com" },
      { protocol: "https", hostname: "crafatar.com" },
      { protocol: "https", hostname: "mc-heads.net" },
      { protocol: "https", hostname: "mineskin.eu" },
      { protocol: "https", hostname: "textures.minecraft.net" },
    ],
  },
};

export default nextConfig;
