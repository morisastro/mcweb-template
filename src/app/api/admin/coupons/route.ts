import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/server/auth";
import { prisma } from "@/server/db";
import { audit } from "@/server/audit";
import { z } from "zod";

const Create = z.object({
  code: z.string().min(2).max(40),
  description: z.string().optional(),
  type: z.enum(["PERCENT", "AMOUNT"]),
  value: z.number().positive(),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
  usageLimit: z.number().int().positive().optional(),
  active: z.boolean().default(true),
  modeIds: z.array(z.string()).optional(),
  productIds: z.array(z.string()).optional(),
});

export async function GET() {
  await requireAdmin();
  return NextResponse.json(await prisma.coupon.findMany({ orderBy: { createdAt: "desc" }, include: { modes: true, products: true, _count: { select: { usages: true } } } }));
}

export async function POST(req: NextRequest) {
  const s = await requireAdmin();
  const body = await req.json().catch(() => null);
  const parsed = Create.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const { modeIds, productIds, startsAt, endsAt, ...rest } = parsed.data;
  try {
    const c = await prisma.coupon.create({
      data: {
        ...rest,
        code: rest.code.toUpperCase(),
        startsAt: startsAt ? new Date(startsAt) : null,
        endsAt: endsAt ? new Date(endsAt) : null,
        modes: modeIds?.length ? { connect: modeIds.map((id) => ({ id })) } : undefined,
        products: productIds?.length ? { connect: productIds.map((id) => ({ id })) } : undefined,
      },
    });
    await audit("coupon.create", { actorId: s.id, target: c.code });
    return NextResponse.json(c);
  } catch {
    return NextResponse.json({ error: "Kod już istnieje" }, { status: 400 });
  }
}
