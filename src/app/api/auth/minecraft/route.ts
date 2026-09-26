import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { getSessionUser, createSession, setSessionCookie } from "@/server/auth";
import { resolveByUsername } from "@/server/mojang";
import { z } from "zod";
import { ipRateLimit, rateLimitHeaders } from "@/server/ratelimit";
import { audit } from "@/server/audit";

const Body = z.object({
  nick: z.string().regex(/^[A-Za-z0-9_]{3,16}$/, "Nieprawidłowy nick"),
});

export async function POST(req: NextRequest) {
  const rl = ipRateLimit(req, "mc-login", 10, 60_000);
  if (!rl.ok) return rateLimitHeaders(NextResponse.json({ error: "Zbyt wiele prób. Spróbuj później." }, { status: 429 }), rl, 10);

  const body = await req.json().catch(() => null);
  const parsed = Body.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Nieprawidłowy nick" }, { status: 400 });

  const profile = await resolveByUsername(parsed.data.nick);
  if (!profile) return NextResponse.json({ error: "Nie znaleziono konta Minecraft o tym nicku" }, { status: 404 });

  const current = await getSessionUser();

  // find existing minecraft account
  const existing = await prisma.minecraftAccount.findUnique({
    where: { uuid: profile.uuid },
    include: { user: true },
  });

  let userId: string;
  if (current) {
    userId = current.id;
    if (existing && existing.userId !== current.id) {
      await prisma.minecraftAccount.update({ where: { id: existing.id }, data: { userId: current.id } });
    } else if (!existing) {
      await prisma.minecraftAccount.create({
        data: { userId: current.id, uuid: profile.uuid, username: profile.username, skinUrl: profile.skinUrl, rank: null },
      });
    } else {
      await prisma.minecraftAccount.update({
        where: { id: existing.id },
        data: { username: profile.username, skinUrl: profile.skinUrl },
      });
    }
  } else if (existing) {
    userId = existing.userId;
    await prisma.minecraftAccount.update({
      where: { id: existing.id },
      data: { username: profile.username, skinUrl: profile.skinUrl },
    });
  } else {
    const user = await prisma.user.create({
      data: {
        displayName: profile.username,
        minecraft: {
          create: { uuid: profile.uuid, username: profile.username, skinUrl: profile.skinUrl, rank: null },
        },
      },
    });
    userId = user.id;
  }

  await prisma.user.update({ where: { id: userId }, data: { lastLoginAt: new Date() } });
  const token = await createSession(userId, req);
  await setSessionCookie(token);
  await audit("auth.minecraft", { actorId: userId, ip: req.headers.get("x-forwarded-for") ?? undefined, target: profile.username });

  return NextResponse.json({ ok: true });
}
