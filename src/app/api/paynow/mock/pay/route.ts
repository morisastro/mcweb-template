import { NextRequest, NextResponse } from "next/server";
import { mockGet, mockSetStatus } from "@/server/paynow";
import { config } from "@/config/server";

// Mock payment page: simulates the user paying on Paynow's hosted checkout.
// In production this route does not exist — the real Paynow gateway handles it.

export async function GET(req: NextRequest) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });
  const mock = mockGet(id);
  if (!mock) return NextResponse.json({ error: "not found" }, { status: 404 });

  const order = mock.externalId;
  return new NextResponse(MOCK_HTML(id, order, mock.status), {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const id = String(form.get("id") ?? "");
  const action = String(form.get("action") ?? "");
  const mock = mockGet(id);
  if (!mock) return NextResponse.json({ error: "not found" }, { status: 404 });

  const status = action === "pay" ? "CONFIRMED" : "REJECTED";
  mockSetStatus(id, status);

  // fire internal webhook (signed as mock -> bypass signature)
  const webhookUrl = `${config.appUrl}/api/paynow/webhook`;
  await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ paymentId: id, externalId: mock.externalId, status }),
  });

  return NextResponse.redirect(new URL(`/zamowienie/${mock.externalId}`, config.appUrl));
}

function MOCK_HTML(id: string, order: string, status: string) {
  return `<!doctype html><html lang="pl"><head><meta charset="utf-8"><title>Mock Paynow</title>
<style>body{background:#0a090d;color:#eee;font-family:system-ui;display:grid;place-items:center;min-height:100vh;margin:0}
.c{background:#121017;border:1px solid #ffffff14;border-radius:16px;padding:32px;max-width:420px;text-align:center}
h1{margin:0 0 8px}p{color:#a8a3ba;margin:0 0 24px}
button{background:#8a63ff;color:#fff;border:0;border-radius:8px;padding:10px 16px;margin:4px;font-weight:600;cursor:pointer}
.d{background:transparent;color:#ddd;border:1px solid #ffffff22}
</style></head><body><div class="c"><h1>Mock Paynow</h1>
<p>Zamówienie <code>${order}</code><br>Status: <b>${status}</b></p>
<form method="post">
<input type="hidden" name="id" value="${id}">
<button type="submit" name="action" value="pay">Opłać (potwierdź)</button>
<button type="submit" name="action" value="reject" class="d">Odrzuć</button>
</form></div></body></html>`;
}
