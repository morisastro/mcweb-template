import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/server/auth";
import { prisma } from "@/server/db";

export async function GET() {
  await requireAdmin();
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { items: true, payments: { take: 1 }, user: true, deliveries: true },
  });
  return NextResponse.json(
    orders.map((o) => ({
      id: o.id,
      publicId: o.publicId,
      playerNick: o.playerNick,
      total: o.total.toNumber(),
      createdAt: o.createdAt,
      paymentStatus: o.payments[0]?.status ?? "CREATED",
      deliveryStatus: o.deliveries.length
        ? o.deliveries.every((d) => d.status === "DELIVERED")
          ? "DELIVERED"
          : o.deliveries.some((d) => d.status === "FAILED")
            ? "FAILED"
            : "PROCESSING"
        : "WAITING",
      user: o.user?.displayName ?? null,
      items: o.items.length,
    })),
  );
}

export async function PUT(req: NextRequest) {
  await requireAdmin();
  const body = await req.json().catch(() => ({}));
  // refund handling: set payment status to REFUNDED
  const { orderId, action } = body as { orderId?: string; action?: string };
  if (action === "refund" && orderId) {
    await prisma.payment.updateMany({ where: { orderId, status: "PAID" }, data: { status: "REFUNDED" } });
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "invalid" }, { status: 400 });
}
