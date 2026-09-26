import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/server/auth";
import { prisma } from "@/server/db";
import { audit } from "@/server/audit";
import { z } from "zod";

function Create() {
  return z.object({
    slug: z.string().regex(/^[a-z0-9-]+$/).optional(),
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    price: z.number().positive().optional(),
    oldPrice: z.number().positive().optional(),
    icon: z.string().optional(),
    image: z.string().optional(),
    modeId: z.string().optional(),
    categoryId: z.string().optional(),
    commands: z.array(z.string()).optional(),
    duration: z.string().optional(),
    featured: z.boolean().optional(),
    active: z.boolean().optional(),
    sort: z.number().int().optional(),
  });
}

export async function PUT(req: NextRequest, ctx: { params: { id: string } }) {
  const s = await requireAdmin();
  const body = await req.json().catch(() => null);
  const parsed = Create().safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const p = await prisma.product.update({ where: { id: ctx.params.id }, data: parsed.data });
  await audit("product.update", { actorId: s.id, target: p.slug });
  return NextResponse.json(p);
}

export async function DELETE(_req: NextRequest, ctx: { params: { id: string } }) {
  const s = await requireAdmin();
  try {
    const p = await prisma.product.delete({ where: { id: ctx.params.id } });
    await audit("product.delete", { actorId: s.id, target: p.slug });
    return NextResponse.json({ ok: true });
  } catch {
    // Product has existing orders — cannot delete (FK constraint). Deactivate instead.
    const p = await prisma.product.update({ where: { id: ctx.params.id }, data: { active: false } }).catch(() => null);
    return NextResponse.json(
      { error: "Nie można usunąć produktu z zamówzeniami. Produkt został zdezaktywowany.", deactivated: true, id: p?.id },
      { status: 409 },
    );
  }
}
