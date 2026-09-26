import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/server/auth";
import { prisma } from "@/server/db";
import { audit } from "@/server/audit";
import { z } from "zod";

const Create = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  description: z.string().optional(),
  icon: z.string().optional(),
  order: z.number().int().default(0),
  visible: z.boolean().default(true),
});

export async function GET() {
  await requireAdmin();
  return NextResponse.json(await prisma.serverMode.findMany({ orderBy: { order: "asc" }, include: { _count: { select: { products: true } } } }));
}

export async function POST(req: NextRequest) {
  const s = await requireAdmin();
  const body = await req.json().catch(() => null);
  const parsed = Create.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  try {
    const mode = await prisma.serverMode.create({ data: parsed.data });
    await audit("mode.create", { actorId: s.id, target: mode.slug });
    return NextResponse.json(mode);
  } catch {
    return NextResponse.json({ error: "Slug już istnieje" }, { status: 400 });
  }
}
