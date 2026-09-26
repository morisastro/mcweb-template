import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db";

// Live order status for /zamowienie/[id]. Separates payment status from delivery status.

export async function GET(req: NextRequest, ctx: { params: { id: string } }) {
  const order = await prisma.order.findUnique({
    where: { publicId: ctx.params.id },
    include: {
      items: true,
      payments: { orderBy: { createdAt: "desc" }, take: 1 },
      deliveries: true,
    },
  });
  if (!order) return NextResponse.json({ error: "Nie znaleziono zamówienia" }, { status: 404 });

  const payment = order.payments[0];
  const paymentStatus = payment?.status ?? "CREATED";
  const deliveries = order.deliveries;
  const deliveryStatus =
    deliveries.length === 0
      ? "WAITING"
      : deliveries.every((d) => d.status === "DELIVERED")
        ? "DELIVERED"
        : deliveries.some((d) => d.status === "FAILED")
          ? "FAILED"
          : deliveries.some((d) => d.status === "PROCESSING")
            ? "PROCESSING"
            : "WAITING";

  return NextResponse.json({
    publicId: order.publicId,
    createdAt: order.createdAt,
    playerNick: order.playerNick,
    total: order.total,
    items: order.items.map((i) => ({ name: i.name, quantity: i.quantity, unitPrice: i.unitPrice })),
    payment: payment
      ? { status: paymentStatus, paynowId: payment.paynowId, paymentUrl: payment.paymentUrl, confirmedAt: payment.confirmedAt }
      : null,
    delivery: {
      status: deliveryStatus,
      jobs: deliveries.map((d) => ({
        productName: d.productName,
        status: d.status,
        attempts: d.attempts,
        lastError: d.lastError,
        deliveredAt: d.deliveredAt,
      })),
    },
  });
}
