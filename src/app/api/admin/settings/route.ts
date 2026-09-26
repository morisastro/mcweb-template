import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/server/auth";
import { prisma } from "@/server/db";
import { setManySettings, getPublicSettings, SETTING_KEYS } from "@/server/settings";
import { audit } from "@/server/audit";
import { z } from "zod";

export async function GET() {
  await requireAdmin();
  const all = await prisma.setting.findMany();
  return NextResponse.json(Object.fromEntries(all.map((s) => [s.key, s.value])));
}

const Update = z.object({
  serverName: z.string().optional(),
  minecraftIp: z.string().optional(),
  minecraftVersion: z.string().optional(),
  accentColor: z.string().optional(),
  logo: z.string().optional(),
  discordUrl: z.string().optional(),
  description: z.string().optional(),
  currency: z.string().optional(),
  discordPurchaseWebhook: z.string().optional(),
  discordErrorWebhook: z.string().optional(),
  discordTicketWebhook: z.string().optional(),
});

export async function PUT(req: NextRequest) {
  const s = await requireAdmin();
  const body = await req.json().catch(() => null);
  const parsed = Update.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const map: Record<string, string> = {};
  if (parsed.data.serverName != null) map[SETTING_KEYS.serverName] = parsed.data.serverName;
  if (parsed.data.minecraftIp != null) map[SETTING_KEYS.minecraftIp] = parsed.data.minecraftIp;
  if (parsed.data.minecraftVersion != null) map[SETTING_KEYS.minecraftVersion] = parsed.data.minecraftVersion;
  if (parsed.data.accentColor != null) map[SETTING_KEYS.accentColor] = parsed.data.accentColor;
  if (parsed.data.logo != null) map[SETTING_KEYS.logo] = parsed.data.logo;
  if (parsed.data.discordUrl != null) map[SETTING_KEYS.discordUrl] = parsed.data.discordUrl;
  if (parsed.data.description != null) map[SETTING_KEYS.description] = parsed.data.description;
  if (parsed.data.currency != null) map[SETTING_KEYS.currency] = parsed.data.currency;
  if (parsed.data.discordPurchaseWebhook != null) map["discord.webhook.purchase"] = parsed.data.discordPurchaseWebhook;
  if (parsed.data.discordErrorWebhook != null) map["discord.webhook.error"] = parsed.data.discordErrorWebhook;
  if (parsed.data.discordTicketWebhook != null) map["discord.webhook.ticket"] = parsed.data.discordTicketWebhook;

  await setManySettings(map);
  await audit("settings.update", { actorId: s.id });
  return NextResponse.json({ ok: true });
}
