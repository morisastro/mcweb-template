import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/server/auth";
import { prisma } from "@/server/db";
import { audit } from "@/server/audit";
import { z } from "zod";

const Body = z.object({
  platform: z.enum(["YOUTUBE", "TIKTOK", "TWITCH", "OTHER"]),
  profileUrl: z.string().url(),
  followers: z.number().int().min(0),
  avgViews: z.number().int().min(0),
  contentUrl: z.string().url(),
  message: z.string().max(2000).optional(),
});

export async function POST(req: NextRequest) {
  const session = await requireUser().catch(() => null);
  if (!session) return NextResponse.json({ error: "Zaloguj się" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = Body.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Nieprawidłowe dane" }, { status: 400 });

  const app = await prisma.mediaApplication.create({
    data: { userId: session.id, ...parsed.data },
  });
  await audit("media.submit", { actorId: session.id, target: app.id });
  return NextResponse.json({ ok: true, id: app.id });
}

export async function GET() {
  const session = await requireUser().catch(() => null);
  if (!session) return NextResponse.json({ error: "Zaloguj się" }, { status: 401 });
  const apps = await prisma.mediaApplication.findMany({
    where: { userId: session.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(apps);
}
