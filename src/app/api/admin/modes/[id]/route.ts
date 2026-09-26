import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/server/auth";
import { prisma } from "@/server/db";
import { audit } from "@/server/audit";
import { z } from "zod";

const Update = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  icon: z.string().optional(),
  order: z.number().int().optional(),
  visible: z.boolean().optional(),
});

export async function PUT(req: NextRequest, ctx: { params: { id: string } }) {
  const s = await requireAdmin();
  const body = await req.json().catch(() => null);
  const parsed = Update.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const mode = await prisma.serverMode.update({ where: { id: ctx.params.id }, data: parsed.data });
  await audit("mode.update", { actorId: s.id, target: mode.slug });
  return NextResponse.json(mode);
}

export async function DELETE(_req: NextRequest, ctx: { params: { id: string } }) {
  const s = await requireAdmin();
  try {
    await prisma.serverMode.delete({ where: { id: ctx.params.id } });
    await audit("mode.delete", { actorId: s.id, target: ctx.params.id });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Nie można usunąć trybu — ma powiązane produkty lub serwery. Ukryj go zamiast tego." },
      { status: 409 },
    );
  }
}
