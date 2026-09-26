import { SiteShell } from "@/components/site-shell";
import { getPublicSettings } from "@/server/settings";
import { config } from "@/config/server";
import { prisma } from "@/server/db";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default async function SklepPage() {
  const settings = await getPublicSettings();
  const name = settings["server.name"] ?? config.serverName;

  const modes = await prisma.serverMode.findMany({
    where: { visible: true },
    orderBy: { order: "asc" },
    include: { _count: { select: { products: { where: { active: true } } } } },
  });

  return (
    <SiteShell serverName={name} logo={settings["server.logo"] ?? null} discordUrl={settings["server.discordUrl"] ?? config.discordUrl}>
      <div className="container-page py-12">
        <div className="mb-10">
          <h1 className="font-display text-4xl font-bold">Sklep</h1>
          <p className="mt-2 text-ink-soft">Wybierz tryb, aby przejrzeć dostępne produkty.</p>
        </div>

        {modes.length === 0 ? (
          <div className="card p-12 text-center text-ink-faint">Sklep jest pusty. Dodaj tryby i produkty w panelu admina.</div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {modes.map((m, i) => (
              <Link
                key={m.id}
                href={`/sklep/${m.slug}`}
                className="card card-hover group animate-fade-up p-7 [animation-delay:${i * 60}ms]"
              >
                <div className="mb-5 grid h-14 w-14 place-items-center rounded-xl bg-accent/10 text-3xl text-accent">
                  {m.icon ?? "🎮"}
                </div>
                <div className="font-display text-xl font-semibold">{m.name}</div>
                <p className="mt-1 line-clamp-2 text-sm text-ink-soft">{m.description ?? "Produkty dla tego trybu."}</p>
                <div className="mt-5 flex items-center justify-between text-sm">
                  <span className="text-ink-faint">{m._count.products} produktów</span>
                  <span className="inline-flex items-center gap-1 text-accent opacity-0 transition group-hover:opacity-100">
                    Wejdź <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </SiteShell>
  );
}
