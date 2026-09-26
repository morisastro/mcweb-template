import { prisma } from "@/server/db";
import { randomToken, shortId } from "@/lib/utils";
import { Decimal } from "@prisma/client/runtime/library";
import { z } from "zod";
import { enqueueDeliveries } from "@/server/storebridge";
import { audit } from "@/server/audit";

// ---------------------------------------------------------------------------
// Checkout / order service.
// CRITICAL: prices are NEVER taken from the frontend. We re-fetch every
// product from the DB and compute totals server-side. Coupons are validated
// and discounted server-side only.
// ---------------------------------------------------------------------------

export const CartLineSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).max(99),
});

export const CheckoutSchema = z.object({
  playerNick: z.string().regex(/^[A-Za-z0-9_]{3,16}$/, "Nieprawidłowy nick"),
  forOther: z.boolean().default(false),
  couponCode: z.string().optional(),
  email: z.string().email().optional(),
  lines: z.array(CartLineSchema).min(1, "Koszyk jest pusty"),
});

export type CheckoutInput = z.infer<typeof CheckoutSchema>;

export interface ComputedOrder {
  lines: { productId: string; name: string; unitPrice: Decimal; quantity: number; modeId: string; commands: string[] }[];
  subtotal: Decimal;
  discount: Decimal;
  total: Decimal;
  couponId?: string;
}

export async function computeOrder(input: CheckoutInput): Promise<ComputedOrder> {
  const ids = input.lines.map((l) => l.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: ids }, active: true },
    include: { mode: true, category: true },
  });

  if (products.length !== ids.length) {
    throw new Error("Niektóre produkty są niedostępne");
  }

  const lines = input.lines.map((l) => {
    const p = products.find((x) => x.id === l.productId)!;
    return {
      productId: p.id,
      name: p.name,
      unitPrice: p.price,
      quantity: l.quantity,
      modeId: p.modeId,
      commands: p.commands,
    };
  });

  const subtotal = lines.reduce((s, l) => s.add(l.unitPrice.mul(l.quantity)), new Decimal(0));

  let discount = new Decimal(0);
  let couponId: string | undefined;

  if (input.couponCode) {
    const coupon = await validateCoupon(input.couponCode, lines, subtotal);
    if (coupon) {
      discount = coupon.discount;
      couponId = coupon.couponId;
    }
  }

  const total = Decimal.max(subtotal.minus(discount), new Decimal(0));

  return { lines, subtotal, discount, total, couponId };
}

export async function createOrder(
  input: CheckoutInput,
  userId?: string,
  ip?: string,
): Promise<{ orderId: string; publicId: string; computed: ComputedOrder }> {
  const computed = await computeOrder(input);
  const publicId = shortId("ORD");

  const order = await prisma.order.create({
    data: {
      publicId,
      userId: userId ?? null,
      email: input.email ?? null,
      playerNick: input.playerNick,
      forOther: input.forOther,
      subtotal: computed.subtotal,
      discount: computed.discount,
      total: computed.total,
      couponId: computed.couponId ?? null,
      items: {
        create: computed.lines.map((l) => ({
          productId: l.productId,
          name: l.name,
          unitPrice: l.unitPrice,
          quantity: l.quantity,
          commands: l.commands,
          modeId: l.modeId,
        })),
      },
    },
    include: { items: { include: { product: true } } },
  });

  if (computed.couponId) {
    await prisma.coupon.update({
      where: { id: computed.couponId },
      data: { usedCount: { increment: 1 } },
    });
    await prisma.couponUsage.create({
      data: { couponId: computed.couponId, userId, orderId: order.id },
    });
  }

  await audit("order.create", { actorId: userId, target: publicId, ip, meta: { total: computed.total.toString() } });

  return { orderId: order.id, publicId, computed };
}

export async function startPaymentForOrder(
  orderId: string,
  total: Decimal,
  notifyUrl: string,
  returnUrl: string,
  email?: string,
): Promise<{ paymentId: string; redirectUrl: string }> {
  const idempotencyKey = randomToken(16);
  // create Payment record (status CREATED)
  const payment = await prisma.payment.create({
    data: {
      orderId,
      amount: total,
      currency: "PLN",
      status: "CREATED",
      idempotencyKey,
    },
  });

  const { createPayment } = await import("@/server/paynow");
  const order = await prisma.order.findUnique({ where: { id: orderId }, select: { publicId: true } });
  if (!order) throw new Error("Zamówienie nie istnieje");
  const result = await createPayment({
    idempotencyKey,
    externalId: order.publicId,
    amount: total.toNumber(),
    currency: "PLN",
    description: "Zamowienie " + order.publicId,
    returnUrl,
    notifyUrl,
    buyer: email ? { email } : undefined,
  });

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      paynowId: result.paymentId,
      paymentUrl: result.redirectUrl,
      status: "PENDING",
    },
  });

  return { paymentId: result.paymentId, redirectUrl: result.redirectUrl };
}

// ---------------------------------------------------------------------------
// Coupon validation
// ---------------------------------------------------------------------------

async function validateCoupon(
  code: string,
  lines: ComputedOrder["lines"],
  subtotal: Decimal,
): Promise<{ discount: Decimal; couponId: string } | null> {
  const coupon = await prisma.coupon.findUnique({
    where: { code: code.trim().toUpperCase() },
    include: { modes: true, products: true },
  });
  if (!coupon || !coupon.active) return null;
  const now = new Date();
  if (coupon.startsAt && coupon.startsAt > now) return null;
  if (coupon.endsAt && coupon.endsAt < now) return null;
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) return null;

  // mode restriction
  if (coupon.modes.length) {
    const ok = lines.every((l) => coupon.modes.some((m) => m.id === l.modeId));
    if (!ok) return null;
  }
  // product restriction
  if (coupon.products.length) {
    const ok = lines.every((l) => coupon.products.some((p) => p.id === l.productId));
    if (!ok) return null;
  }

  let discount: Decimal;
  if (coupon.type === "PERCENT") {
    discount = subtotal.mul(coupon.value).div(100);
  } else {
    discount = Decimal.min(coupon.value, subtotal);
  }
  discount = Decimal.min(discount, subtotal);
  return { discount, couponId: coupon.id };
}

// ---------------------------------------------------------------------------
// Payment confirmation (called from webhook) -> enqueue deliveries
// ---------------------------------------------------------------------------

export async function confirmPayment(orderId: string, paynowId: string, status: "PAID" | "FAILED" | "REFUNDED", raw?: unknown): Promise<void> {
  // idempotent: find payment by paynowId
  const payment = await prisma.payment.findUnique({ where: { paynowId } });
  if (!payment) return;
  if (payment.status === "PAID" && status === "PAID") return; // already confirmed

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status,
      rawPayload: raw as any,
      confirmedAt: status === "PAID" ? new Date() : payment.confirmedAt,
    },
  });

  if (status === "PAID") {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { product: true } } },
    });
    if (!order) return;
    // idempotency: don't enqueue twice
    const existing = await prisma.deliveryJob.count({ where: { orderId: order.id } });
    if (existing === 0) {
      await enqueueDeliveries({
        orderId: order.id,
        userId: order.userId ?? undefined,
        playerNick: order.playerNick,
        playerUuid: order.playerUuid ?? undefined,
        items: order.items,
      });
    }
    await audit("payment.paid", { target: order.publicId, meta: { amount: payment.amount.toString() } });
  }
}
