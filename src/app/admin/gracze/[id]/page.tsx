"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { formatPLN, durationLabel, timeAgo } from "@/lib/utils";

export default function PlayerDetailPage() {
  const params = useParams<{ id: string }>();
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "player", params.id],
    queryFn: async () => (await fetch(`/api/admin/players/${params.id}`)).json(),
  });

  if (isLoading) return <div className="text-ink-faint">Ładowanie…</div>;
  if (!data?.user) return <div>Nie znaleziono gracza.</div>;
  const u = data.user;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold">{u.displayName ?? "Gracz"}</h1>
        <p className="text-sm text-ink-soft">Rola: {u.role} · {timeAgo(u.createdAt)}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Wydano łącznie" value={formatPLN(data.totalSpent)} accent />
        <Stat label="Czas gry" value={durationLabel(u.playtimeSec)} />
        <Stat label="Zakupy" value={String(data.orders.length)} />
        <Stat label="Tickety" value={String(data.tickets.length)} />
      </div>

      <div className="card p-6">
        <h2 className="mb-4 font-display font-semibold">Konta</h2>
        <div className="grid gap-px bg-line sm:grid-cols-2">
          <Row label="Minecraft nick" value={u.minecraft?.username ?? "—"} />
          <Row label="UUID" value={u.minecraft?.uuid ?? "—"} mono />
          <Row label="Ranga Minecraft" value={u.minecraft?.rank ?? "Gracz"} />
          <Row label="Discord" value={u.discord?.username ?? "—"} />
          <Row label="Discord ID" value={u.discord?.discordId ?? "—"} mono />
          <Row label="Booster" value={u.discord?.isBooster ? "Tak" : "Nie"} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Zakupy">
          {data.orders.map((o: any) => (
            <div key={o.id} className="flex items-center justify-between rounded-lg border bg-bg-soft/40 px-3 py-2.5 text-sm">
              <span>{o.publicId}</span>
              <span className="font-medium">{formatPLN(o.total)}</span>
            </div>
          ))}
          {!data.orders.length && <Empty />}
        </Section>
        <Section title="Realizacje (DeliveryJob)">
          {data.deliveries.map((d: any) => (
            <div key={d.id} className="flex items-center justify-between rounded-lg border bg-bg-soft/40 px-3 py-2.5 text-sm">
              <span>{d.productName} → {d.playerNick}</span>
              <span className="chip !py-0.5">{d.status}</span>
            </div>
          ))}
          {!data.deliveries.length && <Empty />}
        </Section>
        <Section title="Nagrody">
          {data.rewards.map((r: any) => (
            <div key={r.id} className="flex items-center justify-between rounded-lg border bg-bg-soft/40 px-3 py-2.5 text-sm">
              <span>{r.reward.name}</span>
              <span className="text-ink-faint">{timeAgo(r.createdAt)}</span>
            </div>
          ))}
          {!data.rewards.length && <Empty />}
        </Section>
        <Section title="Zgłoszenia Media">
          {data.media.map((m: any) => (
            <div key={m.id} className="flex items-center justify-between rounded-lg border bg-bg-soft/40 px-3 py-2.5 text-sm">
              <span>{m.platform}</span>
              <span className="chip !py-0.5">{m.status}</span>
            </div>
          ))}
          {!data.media.length && <Empty />}
        </Section>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="card p-4">
      <div className="text-xs text-ink-faint">{label}</div>
      <div className={`mt-1 font-display text-xl font-bold ${accent ? "text-accent" : ""}`}>{value}</div>
    </div>
  );
}
function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return <div className="bg-bg-card px-4 py-3"><div className="text-xs text-ink-faint">{label}</div><div className={`text-sm ${mono ? "font-mono" : ""}`}>{value}</div></div>;
}
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="card p-5"><h3 className="mb-3 font-display font-semibold">{title}</h3><div className="space-y-2">{children}</div></div>;
}
function Empty() { return <div className="py-4 text-center text-sm text-ink-faint">Brak</div>; }
