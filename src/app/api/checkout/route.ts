import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/server/auth";
import { CheckoutSchema, createOrder, startPaymentForOrder } from "@/server/order";
import { ipRateLimit, rateLimitHeaders } from "@/server/ratelimit";
import { config } from "@/config/server";
import { prisma } from "@/server/db";

export async function POST(req: NextRequest) {
  const rl = ipRateLimit(req, "checkout", 8, 60_000);
  if (!rl.ok) return rateLimitHeaders(NextResponse.json({ error: "Zbyt wiele prób." }, { status: 429 }), rl, 8);

  const body = await req.json().catch(() => null);
  const parsed = CheckoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Nieprawidłowe dane" }, { status: 400 });
  }

  const user = await getSessionUser().catch(() => null);

  try {
    const { orderId, publicId } = await createOrder(
      parsed.data,
      user?.id,
      req.headers.get("x-forwarded-for") ?? undefined,
    );

    const order = await prisma.order.findUnique({ where: { id: orderId }, select: { total: true } });
    if (!order) return NextResponse.json({ error: "Zamówienie nie istnieje" }, { status: 500 });

    const notifyUrl = `${config.appUrl}/api/paynow/webhook`;
    const returnUrl = `${config.appUrl}/zamowienie/${publicId}`;

    const { redirectUrl } = await startPaymentForOrder(
      orderId,
      order.total,
      notifyUrl,
      returnUrl,
      parsed.data.email,
    );

    return NextResponse.json({ redirectUrl, orderId: publicId });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
