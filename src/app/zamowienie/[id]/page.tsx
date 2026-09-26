"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { Check, Clock, Loader2, X, AlertTriangle, Package } from "lucide-react";
import { cn, formatPLN, timeAgo } from "@/lib/utils";

interface OrderData {
  publicId: string;
  createdAt: string;
  playerNick: string;
  total: string;
  items: { name: string; quantity: number; unitPrice: string }[];
  payment: { status: string; paymentUrl: string | null; confirmedAt: string | null } | null;
  delivery: {
    status: string;
    jobs: { productName: string; status: string; attempts: number; lastError: string | null; deliveredAt: string | null }[];
  };
}

async function fetchOrder(id: string): Promise<OrderData> {
  const res = await fetch(`/api/orders/${id}`);
  if (!res.ok) throw new Error("not found");
  return res.json();
}

const PAYMENT_STEPS = [
  { key: "CREATED", label: "Zamówienie utworzone" },
  { key: "PENDING", label: "Oczekiwanie na płatność" },
  { key: "PAID", label: "Płatność otrzymana" },
];

const DELIVERY_STATES: Record<string, { label: string; color: string }> = {
  WAITING: { label: "Oczekuje w kolejce", color: "text-warn" },
  PROCESSING: { label: "Realizacja…", color: "text-accent" },
  DELIVERED: { label: "Dostarczone", color: "text-ok" },
  FAILED: { label: "Błąd dostawy", color: "text-bad" },
};

export default function OrderPage() {
  const params = useParams<{ id: string }>();
  const { data, isLoading, error } = useQuery({
    queryKey: ["order", params.id],
    queryFn: () => fetchOrder(params.id),
    refetchInterval: (q) => {
      const d = q.state.data;
      if (!d) return 3000;
      const payDone = d.payment?.status === "PAID" || d.payment?.status === "FAILED";
      const delivDone = d.delivery.status === "DELIVERED" || d.delivery.status === "FAILED";
      return payDone && delivDone ? 15000 : 3000;
    },
  });

  if (isLoading) return <Shell><Loader2 className="mx-auto h-6 w-6 animate-spin text-ink-faint" /></Shell>;
  if (error || !data) return <Shell><div className="text-center text-bad">Nie znaleziono zamówienia.</div></Shell>;

  const payStatus = data.payment?.status ?? "CREATED";
  const payIdx = PAYMENT_STEPS.findIndex((s) => s.key === payStatus);
  const payFailed = payStatus === "FAILED";

  return (
    <Shell>
      <div className="animate-fade-up space-y-6">
        <div>
          <div className="text-xs text-ink-faint">Zamówienie</div>
          <h1 className="font-display text-2xl font-bold">{data.publicId}</h1>
          <p className="text-sm text-ink-soft">Gracz: {data.playerNick} · {timeAgo(data.createdAt)}</p>
        </div>

        {/* Payment status */}
        <div className="card p-6">
          <div className="mb-4 text-sm font-medium text-ink-soft">Status płatności</div>
          <div className="flex items-center gap-2">
            {PAYMENT_STEPS.map((s, i) => {
              const done = !payFailed && i <= payIdx;
              const active = !payFailed && i === payIdx && payStatus !== "PAID";
              return (
                <div key={s.key} className="flex flex-1 items-center gap-2">
                  <div className={cn("grid h-8 w-8 place-items-center rounded-full border", done ? "border-ok bg-ok/15 text-ok" : active ? "border-accent text-accent" : "border-line text-ink-faint")}>
                    {done ? <Check className="h-4 w-4" /> : active ? <Clock className="h-4 w-4 animate-pulse" /> : <span className="text-xs">{i + 1}</span>}
                  </div>
                  <span className={cn("hidden text-xs sm:block", done ? "text-ink" : "text-ink-faint")}>{s.label}</span>
                  {i < PAYMENT_STEPS.length - 1 && <div className={cn("h-px flex-1", done ? "bg-ok/40" : "bg-line")} />}
                </div>
              );
            })}
          </div>
          {payFailed && (
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-bad/30 bg-bad/10 p-3 text-sm text-bad">
              <AlertTriangle className="h-4 w-4" /> Płatność nie powiodła się. Spróbuj ponownie.
            </div>
          )}
          {payStatus === "PENDING" && data.payment?.paymentUrl && (
            <a href={data.payment.paymentUrl} className="btn-primary mt-4">
              Opłać teraz
            </a>
          )}
        </div>

        {/* Delivery status */}
        <div className="card p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="text-sm font-medium text-ink-soft">Status realizacji (Minecraft)</div>
            <span className={cn("text-sm font-medium", DELIVERY_STATES[data.delivery.status]?.color ?? "text-ink-soft")}>
              {DELIVERY_STATES[data.delivery.status]?.label ?? data.delivery.status}
            </span>
          </div>
          {data.delivery.jobs.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-ink-faint">
              <Package className="h-4 w-4" /> Dostawa zostanie uruchomiona po potwierdzeniu płatności.
            </div>
          ) : (
            <div className="space-y-2">
              {data.delivery.jobs.map((j, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border bg-bg-soft/40 px-3 py-2.5 text-sm">
                  <span>{j.productName}</span>
                  <span className={cn("font-medium", DELIVERY_STATES[j.status]?.color)}>
                    {DELIVERY_STATES[j.status]?.label ?? j.status}
                  </span>
                </div>
              ))}
            </div>
          )}
          {data.delivery.status === "FAILED" && (
            <p className="mt-3 text-xs text-ink-faint">
              Płatność została otrzymana, ale produkt nie został jeszcze dostarczony. System ponowi próbę automatycznie.
            </p>
          )}
        </div>

        {/* Items */}
        <div className="card p-6">
          <div className="mb-3 text-sm font-medium text-ink-soft">Produkty</div>
          <div className="space-y-2">
            {data.items.map((i, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm">
                <span>{i.name} <span className="text-ink-faint">×{i.quantity}</span></span>
                <span>{formatPLN(i.unitPrice)}</span>
              </div>
            ))}
            <div className="flex items-center justify-between border-t pt-2 font-medium">
              <span>Razem</span>
              <span>{formatPLN(data.total)}</span>
                </div>
            </div>
        </div>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="container-page grid place-items-center py-16">
      <div className="w-full max-w-2xl">{children}</div>
    </div>
  );
}
