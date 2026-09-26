// Public, non-secret project configuration.
// Values can be overridden at runtime via the Settings table (admin panel / setup wizard).
// Secrets MUST live in .env only.

function env(key: string, fallback = ""): string {
  return process.env[key] ?? fallback;
}

function envInt(key: string, fallback: number): number {
  const v = parseInt(process.env[key] ?? "", 10);
  return Number.isNaN(v) ? fallback : v;
}

export const config = {
  serverName: env("SERVER_NAME", "MythCraft"),
  minecraftIp: env("MINECRAFT_IP", "play.mythcraft.pl"),
  minecraftVersion: env("MINECRAFT_VERSION", "1.21.4"),
  accentColor: env("ACCENT_COLOR", "138 99 255"),
  logo: env("SERVER_LOGO", ""),
  discordUrl: env("DISCORD_URL", "https://discord.gg/"),
  currency: env("CURRENCY", "PLN"),
  description: env(
    "SERVER_DESCRIPTION",
    "Nowoczesny serwer Minecraft z unikalnymi trybami, fair-play i aktywną społecznością.",
  ),
  modes: ["BoxPvP", "Survival", "LifeSteal", "SkyGen"] as const,

  auth: {
    secret: env("AUTH_SECRET", "dev-secret-change-me"),
    sessionCookie: env("SESSION_COOKIE_NAME", "mcweb_session"),
    sessionTtl: envInt("SESSION_TTL_SECONDS", 30 * 24 * 3600),
  },

  discord: {
    clientId: env("DISCORD_CLIENT_ID"),
    clientSecret: env("DISCORD_CLIENT_SECRET"),
    redirectUri: env("DISCORD_REDIRECT_URI", "http://localhost:3000/api/auth/discord/callback"),
    botToken: env("DISCORD_BOT_TOKEN"),
    guildId: env("DISCORD_GUILD_ID"),
    syncRoleIds: env("DISCORD_SYNC_ROLES", "").split(",").filter(Boolean),
    boostRoleId: env("DISCORD_ROLE_BOOST_ID"),
  },

  storebridge: {
    secret: env("STOREBRIDGE_SECRET", "dev-sb-secret-change-me"),
    timeoutMs: envInt("STOREBRIDGE_TIMEOUT_MS", 15000),
  },

  paynow: {
    env: env("PAYNOW_ENV", "mock") as "mock" | "sandbox" | "production",
    apiKey: env("PAYNOW_API_KEY"),
    apiSecret: env("PAYNOW_API_SECRET"),
    gatewayUrl: env("PAYNOW_GATEWAY_URL", "https://api.paynow.pl"),
    webhookToken: env("PAYNOW_WEBHOOK_TOKEN"),
  },

  mojang: {
    api: env("MOJANG_API", "https://api.mojang.com"),
  },

  status: {
    pollInterval: envInt("STATUS_POLL_INTERVAL_SECONDS", 30),
  },

  appUrl: env("APP_URL", "http://localhost:3000"),
  nodeEnv: env("NODE_ENV", "development"),
} as const;
