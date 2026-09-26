import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/server/auth";
import { prisma } from "@/server/db";
import { redeemCode } from "@/server/rewards";
import { z } from "zod";

const Body = z.object({ code: z.string().min(1) });

export async function POST(req: NextRequest) {
  const session = await requireUser().catch(() => null);
  if (!session) return NextResponse.json({ error: "Zaloguj się" }, { status: 401 });
  const body = await req.json().catch(() => null);
  const parsed = Body.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Podaj kod" }, { status: 400 });

  const full = await prisma.user.findUnique({ where: { id: session.id }, include: { discord: true, minecraft: true } });
  if (!full) return NextResponse.json({ error: "Brak konta" }, { status: 404 });

  const res = await redeemCode(full, parsed.data.code);
  if (!res.ok) return NextResponse.json({ error: res.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}
