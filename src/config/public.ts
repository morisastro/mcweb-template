import { config } from "@/config/server";

export const publicSettings = {
  serverName: config.serverName,
  minecraftIp: config.minecraftIp,
  minecraftVersion: config.minecraftVersion,
  accentColor: config.accentColor,
  logo: config.logo,
  discordUrl: config.discordUrl,
  currency: config.currency,
  description: config.description,
};

export type PublicSettings = typeof publicSettings;
