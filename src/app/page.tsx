import { SiteShell } from "@/components/site-shell";
import { ServerStatusCard } from "@/components/server-status-card";
import { getPublicSettings, isSetupComplete } from "@/server/settings";
import { prisma } from "@/server/db";
import Link from "next/link";
import { ArrowRight, Copy, Shield, Sparkles, Trophy, Zap, Gamepad2, Swords, Coins } from "lucide-react";
import { redirect } from "next/navigation";
import { config } from "@/config/server";

export default async function HomePage() {
  const setup = await isSetupComplete();
  if (!setup) redirect("/setup");

  const settings = await getPublicSettings();
  const name = settings["server.name"] ?? config.serverName;
  const ip = settings["server.minecraftIp"] ?? config.minecraftIp;
  const version = settings["server.minecraftVersion"] ?? config.minecraftVersion;
  const logo = settings["server.logo"] ?? null;
  const discordUrl = settings["server.discordUrl"] ?? config.discordUrl;
  const description = settings["server.description"] ?? config.description;

  const modes = await prisma.serverMode.findMany({
    where: { visible: true },
    orderBy: { order: "asc" },
  });

  return (
    <SiteShell serverName={name} logo={logo} discordUrl={discordUrl}>
      {/* Hero */}
      <section className="relative overflow-hidden bg-glow">
        <div className="container-page relative z-10 py-20 lg:py-28">
          <div className="flex max-w-2xl flex-col items-center text-center mx-auto">
            <div className="flex flex-col items-center mb-6 animate-fade-up">
              <span className="display-text text-5xl lg:text-7xl text-surface-300 glow-text">
                {name}
              </span>
              <span className="mt-2 text-xs tracking-[0.4em] uppercase text-surface-500 font-sans">
                {ip} · {version}
              </span>
            </div>

            <p className="mb-4 text-base text-surface-300 animate-fade-up [animation-delay:80ms]">{description}</p>
            <p className="mb-10 text-sm text-surface-500 animate-fade-up [animation-delay:120ms]">
              Dołącz do społeczności. Graj, rywalizuj, zdobywaj nagrody.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 animate-fade-up [animation-delay:160ms]">
              <CopyIpHero ip={ip} />
              <a href={discordUrl} target="_blank" rel="noreferrer" className="btn-ghost btn-shine">
                Dołącz na Discord
              </a>
            </div>
          </div>

          <div className="mt-14 mb-10 flex items-center gap-4 w-full max-w-lg mx-auto">
            <span className="divider-line" />
            <span className="text-xs tracking-[0.3em] uppercase text-surface-600">Features</span>
            <span className="divider-line" style={{ ["--dir" as any]: "left" }} />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 w-full max-w-3xl mx-auto">
            <FeatureCard icon={<Swords className="h-5 w-5" />} title="Tryby PvP" desc="BoxPvP, LifeSteal, SkyGen i więcej. Każdy tryb z unikalną mechaniką." />
            <FeatureCard icon={<Coins className="h-5 w-5" />} title="Sklep i nagrody" desc="Rangi, klucze, waluta. Daily, eventy i kody promocyjne." />
            <FeatureCard icon={<Shield className="h-5 w-5" />} title="Fair-play" desc="Aktywna moderacja, anty-cheat, stabilne TPS i niski ping." />
          </div>
        </div>
      </section>

      {/* Status + modes */}
      <section className="container-page py-16">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr] lg:items-start">
          <div className="animate-fade-up">
            <div className="mb-4 flex items-center gap-3">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-surface-500">Status serwera</span>
            </div>
            <ServerStatusCard ip={ip} version={version} />
          </div>

          <div className="animate-fade-up [animation-delay:100ms]">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-surface-500">Dostępne tryby</span>
              <Link href="/sklep" className="text-xs text-ink-soft hover:text-ink transition">Sklep →</Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {modes.length > 0 ? (
                modes.map((m, i) => (
                  <Link key={m.id} href={`/sklep/${m.slug}`} className="card card-hover group p-5 animate-fade-up [animation-delay:${i * 50}ms]">
                    <div className="flex items-start justify-between">
                      <div className="grid h-11 w-11 place-items-center bg-surface-850 text-surface-400 group-hover:text-accent transition">
                        <Gamepad2 className="h-5 w-5" />
                      </div>
                      <ArrowRight className="h-4 w-4 text-surface-600 group-hover:text-accent group-hover:translate-x-0.5 transition" />
                    </div>
                    <div className="mt-4 display-text text-xl text-surface-300">{m.name}</div>
                    <p className="mt-1 text-xs text-surface-500 leading-relaxed">{m.description ?? "Dołącz i graj."}</p>
                  </Link>
                ))
              ) : (
                config.modes.map((m, i) => (
                  <div key={m} className="card p-5 animate-fade-up [animation-delay:${i * 50}ms]">
                    <div className="grid h-11 w-11 place-items-center bg-surface-850 text-surface-400">
                      <Gamepad2 className="h-5 w-5" />
                    </div>
                    <div className="mt-4 display-text text-xl text-surface-300">{m}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Season */}
      <section className="container-page py-12">
        <div className="card relative overflow-hidden p-8 sm:p-12">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-accent/10 blur-3xl" />
          <div className="relative grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-center">
            <div>
              <div className="chip mb-4" style={{ borderColor: "rgb(var(--accent) / 0.4)", color: "rgb(var(--accent))" }}>
                <Trophy className="h-3 w-3" /> Aktualny sezon
              </div>
              <h2 className="display-text text-3xl sm:text-4xl text-surface-300 mb-3">Sezon 4 — Odrodzenie</h2>
              <p className="max-w-xl text-sm text-surface-400 leading-relaxed">
                Nowa mapa, przebudowana ekonomia, sezonowe nagrody i rankingi. Wspinaj się w rankingu,
                zdobywaj ekskluzywne klucze i odblokowaj rangi, których nie kupisz nigdzie indziej.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/nagrody" className="btn-primary btn-shine">Zobacz nagrody</Link>
                <Link href="/sklep" className="btn-ghost">Przeglądaj sklep</Link>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Feature icon={<Shield className="h-4 w-4" />} title="Fair-play" desc="Anty-cheat i moderacja" />
              <Feature icon={<Zap className="h-4 w-4" />} title="Wydajność" desc="Stabilne TPS" />
              <Feature icon={<Sparkles className="h-4 w-4" />} title="Nagrody" desc="Daily, eventy, kody" />
              <Feature icon={<Trophy className="h-4 w-4" />} title="Rankingi" desc="Sezonowe leaderboardy" />
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="container-page py-12">
        <div className="mb-8 flex items-center gap-4">
          <span className="divider-line" />
          <span className="text-xs tracking-[0.3em] uppercase text-surface-600">FAQ</span>
          <span className="divider-line" style={{ ["--dir" as any]: "left" }} />
        </div>
        <div className="grid gap-3 lg:grid-cols-2 max-w-4xl mx-auto">
          {FAQ.map((f, i) => (
            <details key={i} className="card group p-5 [&_summary]:cursor-pointer animate-fade-up [animation-delay:${i * 40}ms]">
              <summary className="flex items-center justify-between text-sm font-medium text-surface-300 marker:hidden">
                {f.q}
                <span className="text-surface-600 transition group-open:rotate-45 text-lg leading-none">+</span>
              </summary>
              <p className="mt-3 text-xs text-surface-500 leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    </SiteShell>
  );
}

const FAQ = [
  { q: "Jak dołączyć do serwera?", a: "Skopiuj adres IP, uruchom Minecraft w odpowiedniej wersji i dodaj serwer w liście. Jeśli serwer jest online, wejdziesz od razu." },
  { q: "Czy mogę połączyć konto Discord i Minecraft?", a: "Tak. Zaloguj się przez Discord lub Minecraft w zakładce Konto, a następnie połącz drugie konto w profilu." },
  { q: "Jak długo trwa realizacja zakupu?", a: "Komendy wykonywane są automatycznie przez plugin StoreBridge po potwierdzeniu płatności. Jeśli serwer jest offline, zamówienie czeka w kolejce." },
  { q: "Czy płatność jest bezpieczna?", a: "Tak. Płatności obsługuje Paynow. Status zamówienia potwierdzamy wyłącznie na podstawie zweryfikowanego webhooka." },
];

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="card card-hover group p-5 text-left">
      <div className="mb-3 flex h-9 w-9 items-center justify-center bg-surface-850 text-accent transition group-hover:bg-surface-800">
        {icon}
      </div>
      <h3 className="mb-1 text-sm font-semibold text-surface-300">{title}</h3>
      <p className="text-xs text-surface-500 leading-relaxed">{desc}</p>
    </div>
  );
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="border border-surface-800/40 bg-surface-950 p-4">
      <div className="mb-2 text-accent">{icon}</div>
      <div className="text-sm font-medium text-surface-300">{title}</div>
      <div className="text-xs text-surface-500">{desc}</div>
    </div>
  );
}

function CopyIpHero({ ip }: { ip: string }) {
  return (
    <div className="flex items-center gap-2 border border-surface-700/40 bg-surface-850 px-5 py-3">
      <span className="text-[10px] uppercase tracking-[0.2em] text-surface-500">IP</span>
      <code className="font-mono text-sm font-medium text-surface-300">{ip}</code>
      <Copy className="h-3.5 w-3.5 text-surface-600" />
    </div>
  );
}
