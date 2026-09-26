import { prisma } from "@/server/db";

export const SETTING_KEYS = {
  setupComplete: "setup.complete",
  serverName: "server.name",
  minecraftIp: "server.minecraftIp",
  minecraftVersion: "server.minecraftVersion",
  accentColor: "server.accentColor",
  logo: "server.logo",
  discordUrl: "server.discordUrl",
  description: "server.description",
  currency: "server.currency",
} as const;

export type SettingKey = (typeof SETTING_KEYS)[keyof typeof SETTING_KEYS];

const PUBLIC_KEYS = new Set<string>([
  SETTING_KEYS.serverName,
  SETTING_KEYS.minecraftIp,
  SETTING_KEYS.minecraftVersion,
  SETTING_KEYS.accentColor,
  SETTING_KEYS.logo,
  SETTING_KEYS.discordUrl,
  SETTING_KEYS.description,
  SETTING_KEYS.currency,
]);

export async function getSetting(key: string): Promise<string | null> {
  const row = await prisma.setting.findUnique({ where: { key } });
  return row?.value ?? null;
}

export async function getSettings(keys: string[]): Promise<Record<string, string>> {
  const rows = await prisma.setting.findMany({ where: { key: { in: keys } } });
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

export async function setSetting(key: string, value: string, isPublic = false): Promise<void> {
  await prisma.setting.upsert({
    where: { key },
    update: { value, public: isPublic || PUBLIC_KEYS.has(key) },
    create: { key, value, public: isPublic || PUBLIC_KEYS.has(key) },
  });
}

export async function setManySettings(entries: Record<string, string>): Promise<void> {
  await prisma.$transaction(
    Object.entries(entries).map(([key, value]) =>
      prisma.setting.upsert({
        where: { key },
        update: { value, public: PUBLIC_KEYS.has(key) },
        create: { key, value, public: PUBLIC_KEYS.has(key) },
      }),
    ),
  );
}

export async function isSetupComplete(): Promise<boolean> {
  return (await getSetting(SETTING_KEYS.setupComplete)) === "1";
}

/** Returns public settings merged over .env defaults for frontend. */
export async function getPublicSettings(): Promise<Record<string, string>> {
  const keys = Array.from(PUBLIC_KEYS);
  const stored = await getSettings(keys);
  return stored;
}

export async function applyAccentColor(): Promise<string | null> {
  return (await getSetting(SETTING_KEYS.accentColor)) ?? null;
}
