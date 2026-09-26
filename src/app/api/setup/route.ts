import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { isSetupComplete, setManySettings, SETTING_KEYS } from "@/server/settings";
import { createSession, setSessionCookie } from "@/server/auth";
import { randomToken } from "@/lib/utils";
import { z } from "zod";
import { audit } from "@/server/audit";

const Schema = z.object({
  serverName: z.string().min(2).max(60),
  minecraftIp: z.string().min(3).max(120),
  minecraftVersion: z.string().min(2).max(20),
  accentColor: z.string().regex(/^\d{1,3} \d{1,3} \d{1,3}$/, "Format: R G B (np. 138 99 255)"),
  logo: z.string().url().optional().or(z.literal("")),
  discordUrl: z.string().url().optional().or(z.literal("")),
  description: z.string().max(300).optional(),
  adminUsername: z.string().min(3).max(32),
  adminPassword: z.string().min(8).max(128),
  paynowEnv: z.enum(["mock", "sandbox", "production"]),
  modeName: z.string().min(2).max(40),
  modeSlug: z.string().min(2).max(40).regex(/^[a-z0-9-]+$/),
  productName: z.string().min(2).max(80),
  productPrice: z.number().positive(),
});

export async function GET() {
  return NextResponse.json({ setupComplete: await isSetupComplete() });
}

export async function POST(req: NextRequest) {
  if (await isSetupComplete()) {
    return NextResponse.json({ error: "Setup został już ukończony" }, { status: 403 });
  }
  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Nieprawidłowe dane" }, { status: 400 });
  }
  const d = parsed.data;

  const argon2 = await import("argon2");
  const passwordHash = await argon2.hash(d.adminPassword);

  await prisma.$transaction(async (tx) => {
    // settings
    const settings: Record<string, string> = {
      [SETTING_KEYS.serverName]: d.serverName,
      [SETTING_KEYS.minecraftIp]: d.minecraftIp,
      [SETTING_KEYS.minecraftVersion]: d.minecraftVersion,
      [SETTING_KEYS.accentColor]: d.accentColor,
      [SETTING_KEYS.logo]: d.logo || "",
      [SETTING_KEYS.discordUrl]: d.discordUrl || "",
      [SETTING_KEYS.description]: d.description || "",
      [SETTING_KEYS.setupComplete]: "1",
    };
    for (const [k, v] of Object.entries(settings)) {
      await tx.setting.upsert({ where: { key: k }, update: { value: v }, create: { key: k, value: v } });
    }

    // admin user + link to a User with OWNER role
    const user = await tx.user.create({ data: { displayName: d.adminUsername, role: "OWNER", passwordHash } });
    await tx.adminUser.create({ data: { username: d.adminUsername, passwordHash, userId: user.id } });

    // first mode + product + category
    const category = await tx.category.create({ data: { slug: "rangi", name: "Rangi", order: 0 } });
    const mode = await tx.serverMode.create({ data: { slug: d.modeSlug, name: d.modeName, order: 0, visible: true } });
    await tx.product.create({
      data: {
        slug: d.modeSlug + "-" + d.productName.toLowerCase().replace(/\s+/g, "-").slice(0, 30),
        name: d.productName,
        price: d.productPrice,
        modeId: mode.id,
        categoryId: category.id,
        commands: [`lp user {player} parent addtemp ${d.productName.toLowerCase().replace(/\s+/g, "")} 30d`],
        duration: "30d",
        sort: 0,
        active: true,
      },
    });

    // default categories
    for (const [slug, cname, order] of [["klucze", "Klucze", 1], ["waluta", "Waluta", 2], ["przedmioty", "Przedmioty", 3], ["pakiety", "Pakiety", 4]] as const) {
      const exists = await tx.category.findUnique({ where: { slug } });
      if (!exists) await tx.category.create({ data: { slug, name: cname, order } });
    }
  });

  // log in the new admin
  const adminUser = await prisma.user.findFirst({ where: { displayName: d.adminUsername, role: "OWNER" } });
  if (adminUser) {
    const token = await createSession(adminUser.id, req);
    await setSessionCookie(token);
    await audit("setup.complete", { actorId: adminUser.id });
  }

  return NextResponse.json({ ok: true });
}
