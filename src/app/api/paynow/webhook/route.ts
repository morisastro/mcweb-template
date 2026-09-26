import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { verifyWebhookSignature, mapPaynowStatus, PaynowWebhookBody } from "@/server/paynow";
import { confirmPayment } from "@/server/order";
import { config } from "@/config/server";

// Paynow webhook. Payment is confirmed ONLY here (client redirect is not trusted).
// Idempotency is enforced inside confirmPayment (PAID+PAID is a no-op, deliveries enqueued once).

export async function POST(req: NextRequest) {
  const raw = await req.text();

  // signature verification (skipped in mock env; mock webhooks are internal & signed by route)
  if (config.paynow.env !== "mock") {
    const ok = await verifyWebhookSignature(req.headers, raw);
    if (!ok) return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  let body: PaynowWebhookBody;
  try {
    body = JSON.parse(raw) as PaynowWebhookBody;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  if (!body.paymentId || !body.externalId) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { publicId: body.externalId },
    select: { id: true, publicId: true },
  });
  if (!order) return NextResponse.json({ error: "order not found" }, { status: 404 });

  const status = mapPaynowStatus(body.status);
  if (status === "PAID" || status === "FAILED" || status === "REFUNDED") {
    await confirmPayment(order.id, body.paymentId, status, body);
  }

  return NextResponse.json({ ok: true });
}
