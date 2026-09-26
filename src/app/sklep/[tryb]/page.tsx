import { SiteShell } from "@/components/site-shell";
import { getPublicSettings } from "@/server/settings";
import { config } from "@/config/server";
import { prisma } from "@/server/db";
import { notFound } from "next/navigation";
import { ProductGrid } from "@/components/product-grid";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function SklepTrybPage({ params }: { params: { tryb: string } }) {
  const mode = await prisma.serverMode.findUnique({
    where: { slug: params.tryb },
    include: { products: { where: { active: true }, include: { category: true }, orderBy: { sort: "asc" } } },
  });
  if (!mode) notFound();

  const settings = await getPublicSettings();
  const name = settings["server.name"] ?? config.serverName;
  const categories = await prisma.category.findMany({ orderBy: { order: "asc" } });

  return (
    <SiteShell serverName={name} logo={settings["server.logo"] ?? null} discordUrl={settings["server.discordUrl"] ?? config.discordUrl}>
      <div className="container-page py-12">
        <Link href="/sklep" className="mb-6 inline-flex items-center gap-1 text-sm text-ink-soft hover:text-ink">
          <ArrowLeft className="h-4 w-4" /> Wszystkie tryby
        </Link>

        <div className="mb-8 flex items-center gap-4">
          <div className="grid h-14 w-14 place-items-center rounded-xl bg-accent/10 text-3xl">{mode.icon ?? "🎮"}</div>
          <div>
            <h1 className="font-display text-3xl font-bold">{mode.name}</h1>
            <p className="text-sm text-ink-soft">{mode.description}</p>
          </div>
        </div>

        <ProductGrid products={mode.products} categories={categories} />
      </div>
    </SiteShell>
  );
}
