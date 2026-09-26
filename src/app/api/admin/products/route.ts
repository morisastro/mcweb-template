import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/server/auth";
import { prisma } from "@/server/db";
import { audit } from "@/server/audit";
import { z } from "zod";

const Create = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().positive(),
  oldPrice: z.number().positive().optional(),
  icon: z.string().optional(),
  image: z.string().optional(),
  modeId: z.string(),
  categoryId: z.string(),
  commands: z.array(z.string()).default([]),
  duration: z.string().optional(),
  featured: z.boolean().default(false),
  active: z.boolean().default(true),
  sort: z.number().int().default(0),
});

export async function GET() {
  await requireAdmin();
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    include: { mode: true, category: true },
  });
  return NextResponse.json(products);
}

export async function POST(req: NextRequest) {
  const s = await requireAdmin();
  const body = await req.json().catch(() => null);
  const parsed = Create.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  try {
    const p = await prisma.product.create({ data: parsed.data });
    await audit("product.create", { actorId: s.id, target: p.slug });
    return NextResponse.json(p);
  } catch {
    return NextResponse.json({ error: "Slug już istnieje" }, { status: 400 });
  }
}
