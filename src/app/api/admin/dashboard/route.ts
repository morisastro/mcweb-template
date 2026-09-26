import { NextResponse } from "next/server";
import { requireAdmin } from "@/server/auth";
import { prisma } from "@/server/db";
import { Decimal } from "@prisma/client/runtime/library";

export async function GET() {
  await requireAdmin();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    ordersToday,
    ordersCount,
    openTickets,
    claimedRewards,
    pendingDeliveries,
    recentOrders,
    recentTickets,
    recentAudit,
    playersOnline,
  ] = await Promise.all([
    prisma.order.aggregate({ _sum: { total: true }, where: { createdAt: { gte: today } } }),
    prisma.order.count({ where: { createdAt: { gte: today } } }),
    prisma.ticket.count({ where: { status: { in: ["OPEN", "WAITING_FOR_STAFF"] } } }),
    prisma.rewardClaim.count(),
    prisma.deliveryJob.count({ where: { status: { in: ["WAITING", "PROCESSING"] } } }),
    prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 6, include: { items: true, payments: { take: 1 } } }),
    prisma.ticket.findMany({ orderBy: { createdAt: "desc" }, take: 5, include: { user: true } }),
    prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 8, include: { actor: true } }),
    prisma.serverInstance.aggregate({ _sum: { players: true } }),
  ]);

  const salesToday = (ordersToday._sum.total ?? new Decimal(0)).toNumber();

  return NextResponse.json({
    metrics: {
      salesToday,
      ordersToday: ordersCount,
      playersOnline: playersOnline._sum.players ?? 0,
      openTickets,
      claimedRewards,
      pendingDeliveries,
    },
    recentOrders: recentOrders.map((o) => ({
      publicId: o.publicId,
      total: o.total.toNumber(),
      playerNick: o.playerNick,
      createdAt: o.createdAt,
      payment: o.payments[0]?.status ?? "CREATED",
      items: o.items.length,
    })),
    recentTickets: recentTickets.map((t) => ({ publicId: t.publicId, subject: t.subject, status: t.status, user: t.user.displayName })),
    recentAudit: recentAudit.map((a) => ({ action: a.action, actor: a.actor?.displayName ?? "system", createdAt: a.createdAt, target: a.target })),
  });
}
