import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/server/auth";
import { prisma } from "@/server/db";
import { audit } from "@/server/audit";
import { z } from "zod";

const Update = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  type: z.enum(["DISCORD_LINK", "MC_LINK", "BOTH_LINK", "BOOST", "PLAYTIME", "DAILY", "EVENT", "PROMO_CODE", "MEDIA", "CUSTOM"]).optional(),
  icon: z.string().optional(),
  requirement: z.record(z.any()).optional(),
  commands: z.array(z.string()).optional(),
  discordRoleIds: z.array(z.string()).optional(),
  claimLimit: z.number().int().optional(),
  active: z.boolean().optional(),
  order: z.number().int().optional(),
});

export async function PUT(req: NextRequest, ctx: { params: { id: string } }) {
  const s = await requireAdmin();
  const body = await req.json().catch(() => null);
  const parsed = Update.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const r = await prisma.reward.update({ where: { id: ctx.params.id }, data: parsed.data });
  await audit("reward.update", { actorId: s.id, target: r.slug });
  return NextResponse.json(r);
}

export async function DELETE(_req: NextRequest, ctx: { params: { id: string } }) {
  const s = await requireAdmin();
  await prisma.reward.delete({ where: { id: ctx.params.id } });
  await audit("reward.delete", { actorId: s.id, target: ctx.params.id });
  return NextResponse.json({ ok: true });
}
