import { NextRequest, NextResponse } from "next/server";
import { requireUser, requireStaff } from "@/server/auth";
import { prisma } from "@/server/db";

export async function GET(req: NextRequest, ctx: { params: { id: string } }) {
  const session = await requireUser().catch(() => null);
  if (!session) return NextResponse.json({ error: "Zaloguj się" }, { status: 401 });

  const ticket = await prisma.ticket.findUnique({
    where: { publicId: ctx.params.id },
    include: { messages: { orderBy: { createdAt: "asc" } }, user: { include: { discord: true, minecraft: true } } },
  });
  if (!ticket) return NextResponse.json({ error: "Nie znaleziono" }, { status: 404 });
  // only owner or staff
  if (ticket.userId !== session.id && session.role === "USER") {
    return NextResponse.json({ error: "Brak dostępu" }, { status: 403 });
  }
  return NextResponse.json(ticket);
}
