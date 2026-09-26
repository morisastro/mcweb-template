"use client";

import { useQuery } from "@tanstack/react-query";
import { cn, formatPLN, formatNumber, timeAgo } from "@/lib/utils";
import { Link } from "lucide-react";
import Link2 from "next/link";

interface Dash {
  metrics: { salesToday: number; ordersToday: number; playersOnline: number; openTickets: number; claimedRewards: number; pendingDeliveries: number };
  recentOrders: { publicId: string; total: number; playerNick: string; createdAt: string; payment: string; items: number }[];
  recentTickets: { publicId: string; subject: string; status: string; user: string | null }[];
  recentAudit: { action: string; actor: string | null; createdAt: string; target: string | null }[];
}

export default function AdminDashboard() {
  const { data, isLoading } = useQuery<Dash>({ queryKey: ["admin-dashboard"], queryFn: async () => (await fetch("/api/admin/dashboard")).json(), refetchInterval: 15000 });

  if (isLoading) return <div className="text-ink-faint">Ładowanie…</div>;
  if (!data) return null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-ink-soft">Przegląd aktywności serwera.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Metric label="Sprzedaż dziś" value={formatPLN(data.metrics.salesToday)} accent />
        <Metric label="Zamówienia dziś" value={String(data.metrics.ordersToday)} />
        <Metric label="Gracze online" value={formatNumber(data.metrics.playersOnline)} />
        <Metric label="Otwarte tickety" value={String(data.metrics.openTickets)} />
        <Metric label="Nagrody odebrane" value={String(data.metrics.claimedRewards)} />
        <Metric label="DeliveryJob oczekujące" value={String(data.metrics.pendingDeliveries)} warn={data.metrics.pendingDeliveries > 0} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Ostatnie zamówienia" href="/admin/zamowienia">
          <div className="space-y-2">
            {data.recentOrders.map((o) => (
              <Link2 href={`/admin/zamowienia/${o.publicId}`} key={o.publicId} className="flex items-center justify-between rounded-lg border bg-bg-soft/40 px-3 py-2.5 text-sm">
                <div>
                  <div className="font-medium">{o.publicId}</div>
                  <div className="text-xs text-ink-faint">{o.playerNick} · {timeAgo(o.createdAt)}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="chip !py-0.5">{o.payment}</span>
                  <span className="font-medium">{formatPLN(o.total)}</span>
                </div>
              </Link2>
            ))}
            {!data.recentOrders.length && <Empty text="Brak zamówień" />}
          </div>
        </Card>

        <Card title="Ostatnie tickety" href="/admin/tickety">
          <div className="space-y-2">
            {data.recentTickets.map((t) => (
              <Link2 href={`/admin/tickety/${t.publicId}`} key={t.publicId} className="flex items-center justify-between rounded-lg border bg-bg-soft/40 px-3 py-2.5 text-sm">
                <div>
                  <div className="font-medium">{t.subject}</div>
                  <div className="text-xs text-ink-faint">{t.user ?? "—"}</div>
                </div>
                <span className="chip !py-0.5">{t.status.replace(/_/g, " ")}</span>
              </Link2>
            ))}
            {!data.recentTickets.length && <Empty text="Brak ticketów" />}
          </div>
        </Card>

        <Card title="Ostatnie akcje administracji" href="/admin/logi">
          <div className="space-y-2">
            {data.recentAudit.map((a, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border bg-bg-soft/40 px-3 py-2.5 text-sm">
                <div><span className="font-mono text-accent">{a.action}</span> {a.target && <span className="text-ink-faint">→ {a.target}</span>}</div>
                <div className="text-xs text-ink-faint">{a.actor ?? "system"} · {timeAgo(a.createdAt)}</div>
              </div>
            ))}
            {!data.recentAudit.length && <Empty text="Brak logów" />}
          </div>
        </Card>
      </div>
    </div>
  );
}

function Metric({ label, value, accent, warn }: { label: string; value: string; accent?: boolean; warn?: boolean }) {
  return (
    <div className={cn("card p-4", warn && "border-warn/40")}>
      <div className="text-xs text-ink-faint">{label}</div>
      <div className={cn("mt-1 font-display text-2xl font-bold", accent && "text-accent")}>{value}</div>
    </div>
  );
}
function Card({ title, href, children }: { title: string; href: string; children: React.ReactNode }) {
  return (
    <div className="card p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display font-semibold">{title}</h2>
        <Link2 href={href} className="text-xs text-accent">Wszystkie</Link2>
      </div>
      {children}
    </div>
  );
}
function Empty({ text }: { text: string }) {
  return <div className="py-6 text-center text-sm text-ink-faint">{text}</div>;
}
