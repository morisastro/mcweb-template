import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/server/auth";
import { prisma } from "@/server/db";
import { audit } from "@/server/audit";
import { z } from "zod";

const Create = z.object({
  name: z.string().min(1),
  modeId: z.string(),
  host: z.string(),
  port: z.number().int().default(25565),
});

export async function GET() {
  await requireAdmin();
  return NextResponse.json(await prisma.serverInstance.findMany({ include: { mode: true }, orderBy: { name: "asc" } }));
}

export async function POST(req: NextRequest) {
  const s = await requireAdmin();
  const body = await req.json().catch(() => null);
  const parsed = Create.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const inst = await prisma.serverInstance.create({ data: parsed.data });
  await audit("server.create", { actorId: s.id, target: inst.name });
  return NextResponse.json(inst);
}
