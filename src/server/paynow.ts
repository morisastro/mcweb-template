import { config } from "@/config/server";
import { randomToken } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Paynow integration with three providers: mock, sandbox, production.
// Real Paynow REST uses HMAC-SHA256 signatures. We implement the signature
// calc + create payment. The mock provider emulates the flow locally so the
// full checkout -> webhook -> delivery pipeline works without credentials.
// ---------------------------------------------------------------------------

export interface CreatePaymentInput {
  idempotencyKey: string;
  externalId: string; // order public id
  amount: number; // grosze (PLN * 100)
  currency: string;
  description: string;
  returnUrl: string;
  notifyUrl: string;
  buyer?: { email?: string };
}

export interface CreatePaymentResult {
  paymentId: string;
  redirectUrl: string;
  status: string;
  raw?: unknown;
}

export interface PaynowWebhookBody {
  paymentId: string;
  externalId: string;
  status: "NEW" | "PENDING" | "CONFIRMED" | "REJECTED" | "ERROR" | "EXPIRED";
  amount?: number;
  currency?: string;
}

function toGrosze(pln: number | string): number {
  const n = typeof pln === "string" ? parseFloat(pln) : pln;
  return Math.round(n * 100);
}

// ---- Signature (HMAC-SHA256 over sorted header values + body) ----
async function hmac(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, "0")).join("");
}

async function paynowSignature(parts: string[]): Promise<string> {
  return hmac(config.paynow.apiSecret, parts.join("\n"));
}

// ---- Mock provider (local dev / no credentials) ----
const mockStore = new Map<string, { status: string; externalId: string }>();

function mockCreate(input: CreatePaymentInput): CreatePaymentResult {
  const paymentId = "mock_" + randomToken(12);
  mockStore.set(paymentId, { status: "NEW", externalId: input.externalId });
  const redirectUrl = `${config.appUrl}/api/paynow/mock/pay?id=${encodeURIComponent(paymentId)}`;
  return { paymentId, redirectUrl, status: "NEW" };
}

export function mockSetStatus(paymentId: string, status: string): void {
  const e = mockStore.get(paymentId);
  if (e) mockStore.set(paymentId, { ...e, status });
}

export function mockGet(paymentId: string): { status: string; externalId: string } | undefined {
  return mockStore.get(paymentId);
}

// ---- Real Paynow create payment ----
async function realCreate(input: CreatePaymentInput): Promise<CreatePaymentResult> {
  const body = {
    amount: input.amount,
    externalId: input.externalId,
    description: input.description,
    notifyUrl: input.notifyUrl,
    returnUrl: input.returnUrl,
    currency: input.currency,
    buyer: input.buyer,
  };
  const payload = JSON.stringify(body);
  const signature = await paynowSignature([config.paynow.apiKey, payload]);
  const res = await fetch(`${config.paynow.gatewayUrl}/v1/payments`, {
    method: "POST",
    headers: {
      "Api-Key": config.paynow.apiKey,
      "Signature": signature,
      "Content-Type": "application/json",
      "Idempotency-Key": input.idempotencyKey,
    },
    body: payload,
    signal: AbortSignal.timeout(15000),
  });
  const raw = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(`Paynow create failed: ${res.status} ${JSON.stringify(raw)}`);
  }
  const data = raw as { paymentId: string; redirectUrl: string; status: string };
  return { paymentId: data.paymentId, redirectUrl: data.redirectUrl, status: data.status, raw };
}

export async function createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
  const amount = toGrosze(input.amount);
  const safe = { ...input, amount };
  if (config.paynow.env === "mock") return mockCreate(safe);
  if (!config.paynow.apiKey || !config.paynow.apiSecret) {
    throw new Error("Paynow not configured (missing API key/secret)");
  }
  return realCreate(safe);
}

// ---- Webhook signature verification ----
export async function verifyWebhookSignature(headers: Headers, rawBody: string): Promise<boolean> {
  if (config.paynow.env === "mock") return true; // mock webhooks are internal
  const signature = headers.get("Signature") ?? headers.get("signature") ?? "";
  if (!signature || !config.paynow.apiSecret) return false;
  const apiKey = headers.get("Api-Key") ?? "";
  const computed = await paynowSignature([apiKey, rawBody]);
  // constant-time compare
  if (computed.length !== signature.length) return false;
  let diff = 0;
  for (let i = 0; i < computed.length; i++) diff |= computed.charCodeAt(i) ^ signature.charCodeAt(i);
  return diff === 0;
}

/** Map Paynow status to internal PaymentStatus. */
export function mapPaynowStatus(s: string): "PENDING" | "PAID" | "FAILED" | "REFUNDED" {
  switch (s) {
    case "CONFIRMED":
      return "PAID";
    case "PENDING":
    case "NEW":
      return "PENDING";
    case "REJECTED":
    case "ERROR":
    case "EXPIRED":
      return "FAILED";
    default:
      return "PENDING";
  }
}
