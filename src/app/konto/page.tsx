import { SiteShell } from "@/components/site-shell";
import { getPublicSettings } from "@/server/settings";
import { config } from "@/config/server";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/server/auth";
import { prisma } from "@/server/db";
import { AccountView } from "@/components/account-view";
import { durationLabel, formatPLN, timeAgo } from "@/lib/utils";

export default async function KontoPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const settings = await getPublicSettings();
  const name = settings["server.name"] ?? config.serverName;

  const full = await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      discord: true,
      minecraft: true,
      orders: { orderBy: { createdAt: "desc" }, take: 20, include: { items: true, payments: { take: 1 } } },
      rewardClaims: { include: { reward: true }, orderBy: { createdAt: "desc" } },
      tickets: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });

  const totalSpent = full?.orders
    .filter((o) => o.payments?.[0]?.status === "PAID" || true)
    .reduce((s, o) => s + o.total.toNumber(), 0) ?? 0;

  return (
    <SiteShell serverName={name} logo={settings["server.logo"] ?? null} discordUrl={settings["server.discordUrl"] ?? config.discordUrl}>
      <div className="container-page py-12">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold">Moje konto</h1>
          <p className="text-sm text-ink-soft">Zarządzaj kontem, zakupami i powiązaniami.</p>
        </div>

        <AccountView
          user={user}
          discord={full?.discord ?? null}
          minecraft={full?.minecraft ?? null}
          playtime={full?.playtimeSec ?? 0}
          totalSpent={totalSpent}
        />

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <section className="card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold">Historia zakupów</h2>
              <span className="text-xs text-ink-faint">{full?.orders.length ?? 0} zamówień</span>
            </div>
            {full?.orders.length ? (
              <div className="space-y-2">
                {full.orders.map((o) => (
                  <a key={o.id} href={`/zamowienie/${o.publicId}`} className="flex items-center justify-between rounded-lg border bg-bg-soft/40 px-3 py-2.5 text-sm transition hover:border-accent/40">
                    <div>
                      <div className="font-medium">{o.publicId}</div>
                      <div className="text-xs text-ink-faint">{timeAgo(o.createdAt)} · {o.items.length} poz.</div>
                    </div>
                    <span className="font-medium">{formatPLN(o.total)}</span>
                  </a>
                ))}
              </div>
            ) : (
              <Empty text="Brak zamówień" />
            )}
          </section>

          <section className="card p-6">
            <h2 className="mb-4 font-display text-lg font-semibold">Odebrane nagrody</h2>
            {full?.rewardClaims.length ? (
              <div className="space-y-2">
                {full.rewardClaims.map((r) => (
                  <div key={r.id} className="flex items-center justify-between rounded-lg border bg-bg-soft/40 px-3 py-2.5 text-sm">
                    <span>{r.reward.name}</span>
                    <span className="text-xs text-ink-faint">{timeAgo(r.createdAt)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <Empty text="Brak odebranych nagród" />
            )}
          </section>

          <section className="card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold">Tickety</h2>
              <a href="/konto/tickety" className="text-xs text-accent">Zarządzaj</a>
            </div>
            {full?.tickets.length ? (
              <div className="space-y-2">
                {full.tickets.map((t) => (
                  <a key={t.id} href={`/konto/tickety/${t.publicId}`} className="flex items-center justify-between rounded-lg border bg-bg-soft/40 px-3 py-2.5 text-sm">
                    <span>{t.subject}</span>
                    <span className="chip !py-0.5">{t.status}</span>
                  </a>
                ))}
              </div>
            ) : (
              <Empty text="Brak ticketów" />
            )}
          </section>

          <section className="card p-6">
            <h2 className="mb-4 font-display text-lg font-semibold">Statystyki</h2>
            <div className="grid grid-cols-2 gap-3">
              <Stat label="Czas gry" value={durationLabel(full?.playtimeSec ?? 0)} />
              <Stat label="Wydano łącznie" value={formatPLN(totalSpent)} />
              <Stat label="Ranga" value={full?.minecraft?.rank ?? "Gracz"} />
              <Stat label="Rola" value={user.role} />
            </div>
          </section>
        </div>
      </div>
    </SiteShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-bg-soft/40 p-3">
      <div className="text-xs text-ink-faint">{label}</div>
      <div className="mt-0.5 font-display text-lg font-semibold">{value}</div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="py-8 text-center text-sm text-ink-faint">{text}</div>;
}
