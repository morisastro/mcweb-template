import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/server/auth";
import { prisma } from "@/server/db";

export async function GET(_req: NextRequest, ctx: { params: { id: string } }) {
  await requireStaff();
  const ticket = await prisma.ticket.findUnique({
    where: { publicId: ctx.params.id },
    include: { messages: { orderBy: { createdAt: "asc" } }, user: { include: { discord: true, minecraft: true } } },
  });
  if (!ticket) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(ticket);
}

export async function POST(req: NextRequest, ctx: { params: { id: string } }) {
  const s = await requireStaff();
  const ticket = await prisma.ticket.findUnique({ where: { publicId: ctx.params.id } });
  if (!ticket) return NextResponse.json({ error: "not found" }, {status: 404});
  const body = await req.json().catch(() => ({}));
  const { body: text, attachments } = body as { body?: string; attachments?: string[] };
  if (!text) return NextResponse.json({ error: "empty" }, { status: 400 });
  await prisma.ticketMessage.create({
    data: { ticketId: ticket.id, authorId: s.id, authorRole: "staff", body: text, attachments: attachments ?? [] },
  });
  await prisma.ticket.update({ where: { id: ticket.id }, data: { status: "WAITING_FOR_USER" } });
  return NextResponse.json({ ok: true });
}
