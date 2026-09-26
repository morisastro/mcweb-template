import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/server/auth";
import { prisma } from "@/server/db";
import { shortId } from "@/lib/utils";
import { z } from "zod";
import { audit } from "@/server/audit";

const Body = z.object({
  subject: z.string().min(3).max(120),
  category: z.enum(["POMOC", "ZAKUP", "BAN_APPEAL", "BUG", "WSPOLPRACA", "INNE"]),
  description: z.string().min(10).max(4000),
  attachments: z.array(z.string().url()).max(5).optional(),
});

export async function GET() {
  const session = await requireUser().catch(() => null);
  if (!session) return NextResponse.json({ error: "Zaloguj się" }, { status: 401 });
  const tickets = await prisma.ticket.findMany({
    where: { userId: session.id },
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { messages: true } } },
  });
  return NextResponse.json(tickets);
}

export async function POST(req: NextRequest) {
  const session = await requireUser().catch(() => null);
  if (!session) return NextResponse.json({ error: "Zaloguj się" }, { status: 401 });
  const body = await req.json().catch(() => null);
  const parsed = Body.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Nieprawidłowe dane" }, { status: 400 });

  const ticket = await prisma.ticket.create({
    data: {
      publicId: shortId("TKT"),
      userId: session.id,
      subject: parsed.data.subject,
      category: parsed.data.category,
      description: parsed.data.description,
      status: "OPEN",
      messages: {
        create: { authorId: session.id, authorRole: "user", body: parsed.data.description, attachments: parsed.data.attachments ?? [] },
      },
    },
  });
  await audit("ticket.create", { actorId: session.id, target: ticket.publicId });
  return NextResponse.json({ ok: true, publicId: ticket.publicId });
}
