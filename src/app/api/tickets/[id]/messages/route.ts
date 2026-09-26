import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/server/auth";
import { prisma } from "@/server/db";
import { z } from "zod";

const Body = z.object({
  body: z.string().min(1).max(4000),
  attachments: z.array(z.string().url()).max(5).optional(),
});

export async function POST(req: NextRequest, ctx: { params: { id: string } }) {
  const session = await requireUser().catch(() => null);
  if (!session) return NextResponse.json({ error: "Zaloguj się" }, { status: 401 });

  const ticket = await prisma.ticket.findUnique({ where: { publicId: ctx.params.id } });
  if (!ticket) return NextResponse.json({ error: "Nie znaleziono" }, { status: 404 });
  if (ticket.userId !== session.id && session.role === "USER") {
    return NextResponse.json({ error: "Brak dostępu" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = Body.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Nieprawidłowe dane" }, { status: 400 });

  const isStaff = session.role !== "USER";
  const role = isStaff ? "staff" : "user";

  await prisma.ticketMessage.create({
    data: {
      ticketId: ticket.id,
      authorId: session.id,
      authorRole: role,
      body: parsed.data.body,
      attachments: parsed.data.attachments ?? [],
    },
  });

  await prisma.ticket.update({
    where: { id: ticket.id },
    data: { status: isStaff ? "WAITING_FOR_USER" : "WAITING_FOR_STAFF" },
  });

  return NextResponse.json({ ok: true });
}
