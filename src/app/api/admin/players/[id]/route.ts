import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/server/auth";
import { prisma } from "@/server/db";
import { Decimal } from "@prisma/client/runtime/library";

export async function GET(_req: NextRequest, ctx: { params: { id: string } }) {
  await requireAdmin();
  const [user, orders, rewards, tickets, deliveries, media] = await Promise.all([
    prisma.user.findUnique({ where: { id: ctx.params.id }, include: { discord: true, minecraft: true } }),
    prisma.order.findMany({ where: { userId: ctx.params.id }, include: { payments: { take: 1 } }, orderBy: { createdAt: "desc" } }),
    prisma.rewardClaim.findMany({ where: { userId: ctx.params.id }, include: { reward: true } }),
    prisma.ticket.findMany({ where: { userId: ctx.params.id }, orderBy: { createdAt: "desc" } }),
    prisma.deliveryJob.findMany({ where: { userId: ctx.params.id }, orderBy: { createdAt: "desc" }, take: 30 }),
    prisma.mediaApplication.findMany({ where: { userId: ctx.params.id }, orderBy: { createdAt: "desc" } }),
  ]);
  if (!user) return NextResponse.json({ error: "not found" }, { status: 404 });
  const totalSpent = orders
    .filter((o) => o.payments[0]?.status === "PAID")
    .reduce((s, o) => s.add(o.total), new Decimal(0))
    .toNumber();
  return NextResponse.json({ user, orders, rewards, tickets, deliveries, media, totalSpent });
}
