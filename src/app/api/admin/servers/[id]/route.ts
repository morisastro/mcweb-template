import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/server/auth";
import { prisma } from "@/server/db";

export async function DELETE(_req: NextRequest, ctx: { params: { id: string } }) {
  await requireAdmin();
  await prisma.serverInstance.delete({ where: { id: ctx.params.id } });
  return NextResponse.json({ ok: true });
}
