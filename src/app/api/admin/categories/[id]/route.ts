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
});

export async function PUT(req: NextRequest, ctx: { params: { id: string } }) {
  const s = await requireAdmin();
  const body = await req.json().catch(() => null);
  const parsed = Update.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const cat = await prisma.category.update({ where: { id: ctx.params.id }, data: parsed.data });
  await audit("category.update", { actorId: s.id, target: cat.slug });
  return NextResponse.json(cat);
}

export async function DELETE(_req: NextRequest, ctx: { params: { id: string } }) {
  const s = await requireAdmin();
  try {
    await prisma.category.delete({ where: { id: ctx.params.id } });
    await audit("category.delete", { actorId: s.id, target: ctx.params.id });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Nie można usunąć kategorii — ma powiązane produkty." },
      { status: 409 },
    );
  }
}
