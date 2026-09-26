import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/server/auth";
import { prisma } from "@/server/db";

export async function GET(req: NextRequest) {
  await requireStaff();
  const status = new URL(req.url).searchParams.get("status");
  const tickets = await prisma.ticket.findMany({
    where: status ? { status: status as any } : undefined,
    orderBy: { updatedAt: "desc" },
    include: { user: { include: { minecraft: true, discord: true } }, _count: { select: { messages: true } } },
    take: 200,
  });
  return NextResponse.json(tickets);
}

export async function PUT(req: NextRequest) {
  const s = await requireStaff();
  const body = await req.json().catch(() => ({}));
  const { publicId, status } = body as { publicId?: string; status?: string };
  if (!publicId || !status) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const t = await prisma.ticket.update({
    where: { publicId },
    data: { status: status as any, closedAt: status === "CLOSED" ? new Date() : null, assignedTo: s.id },
  });
  return NextResponse.json(t);
}
