import { NextResponse } from "next/server";
import { requireAdmin } from "@/server/auth";
import { config } from "@/config/server";

export async function GET() {
  await requireAdmin();
  return NextResponse.json({
    oauth: !!(config.discord.clientId && config.discord.clientSecret),
    bot: !!config.discord.botToken,
    guild: !!config.discord.guildId,
  });
}
