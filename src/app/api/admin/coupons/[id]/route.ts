import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/server/auth";
import { prisma } from "@/server/db";
import { audit } from "@/server/audit";

export async function DELETE(_req: NextRequest, ctx: { params: { id: string } }) {
  const s = await requireAdmin();
  await prisma.coupon.delete({ where: { id: ctx.params.id } });
  await audit("coupon.delete", { actorId: s.id, target: ctx.params.id });
  return NextResponse.json({ ok: true });
}

export async function PUT(req: NextRequest, ctx: { params: { id: string } }) {
  const s = await requireAdmin();
  const body = await req.json().catch(() => ({}));
  const { modeIds, productIds, ...rest } = body as Record<string, unknown>;
  const c = await prisma.coupon.update({
    where: { id: ctx.params.id },
    data: {
      ...(rest as any),
      modes: Array.isArray(modeIds) ? { set: (modeIds as string[]).map((id) => ({ id })) } : undefined,
      products: Array.isArray(productIds) ? { set: (productIds as string[]).map((id) => ({ id })) } : undefined,
    },
  });
  await audit("coupon.update", { actorId: s.id, target: c.code });
  return NextResponse.json(c);
}
