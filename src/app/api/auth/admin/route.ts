import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { createSession, setSessionCookie } from "@/server/auth";
import { ipRateLimit, rateLimitHeaders } from "@/server/ratelimit";
import { audit } from "@/server/audit";
import { z } from "zod";

const Body = z.object({
  username: z.string().min(1).max(32),
  password: z.string().min(1).max(128),
});

export async function POST(req: NextRequest) {
  const rl = ipRateLimit(req, "admin-login", 5, 60_000);
  if (!rl.ok) return rateLimitHeaders(NextResponse.json({ error: "Zbyt wiele prób." }, { status: 429 }), rl, 5);

  const body = await req.json().catch(() => null);
  const parsed = Body.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Nieprawidłowe dane" }, { status: 400 });

  const admin = await prisma.adminUser.findUnique({ where: { username: parsed.data.username } });
  if (!admin) return NextResponse.json({ error: "Nieprawidłowy login lub hasło" }, { status: 401 });

  const argon2 = await import("argon2");
  const ok = await argon2.verify(admin.passwordHash, parsed.data.password);
  if (!ok) return NextResponse.json({ error: "Nieprawidłowy login lub hasło" }, { status: 401 });

  const user = admin.userId ? await prisma.user.findUnique({ where: { id: admin.userId } }) : null;
  const userId = user?.id ?? admin.userId;
  if (!userId) return NextResponse.json({ error: "Konto admina nie jest powiązane z użytkownikiem" }, { status: 500 });

  await prisma.user.update({ where: { id: userId }, data: { lastLoginAt: new Date() } });
  const token = await createSession(userId, req);
  await setSessionCookie(token);
  await audit("auth.admin", { actorId: userId, ip: req.headers.get("x-forwarded-for") ?? undefined, target: parsed.data.username });

  return NextResponse.json({ ok: true });
}
