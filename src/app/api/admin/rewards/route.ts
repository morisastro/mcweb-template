import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/server/auth";
import { prisma } from "@/server/db";
import { audit } from "@/server/audit";
import { z } from "zod";

const Create = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(["DISCORD_LINK", "MC_LINK", "BOTH_LINK", "BOOST", "PLAYTIME", "DAILY", "EVENT", "PROMO_CODE", "MEDIA", "CUSTOM"]),
  icon: z.string().optional(),
  requirement: z.record(z.any()).default({}),
  commands: z.array(z.string()).default([]),
  discordRoleIds: z.array(z.string()).default([]),
  claimLimit: z.number().int().default(1),
  active: z.boolean().default(true),
  order: z.number().int().default(0),
});

export async function GET() {
  await requireAdmin();
  return NextResponse.json(await prisma.reward.findMany({ orderBy: { order: "asc" }, include: { _count: { select: { claims: true } } } }));
}

export async function POST(req: NextRequest) {
  const s = await requireAdmin();
  const body = await req.json().catch(() => null);
  const parsed = Create.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  try {
    const r = await prisma.reward.create({ data: parsed.data });
    await audit("reward.create", { actorId: s.id, target: r.slug });
    return NextResponse.json(r);
  } catch {
    return NextResponse.json({ error: "Slug już istnieje" }, { status: 400 });
  }
}
