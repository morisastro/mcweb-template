import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/server/auth";
import { prisma } from "@/server/db";

export async function GET(req: NextRequest) {
  await requireAdmin();
  const action = new URL(req.url).searchParams.get("action");
  const logs = await prisma.auditLog.findMany({
    where: action ? { action: { contains: action, mode: "insensitive" } } : undefined,
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { actor: true },
  });
  return NextResponse.json(logs);
}
