import { SiteShell } from "@/components/site-shell";
import { getPublicSettings } from "@/server/settings";
import { config } from "@/config/server";
import { getSessionUser } from "@/server/auth";
import { prisma } from "@/server/db";
import { redirect } from "next/navigation";
import { TicketList } from "@/components/ticket-list";
import Link from "next/link";

export default async function TicketyPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const settings = await getPublicSettings();
  const name = settings["server.name"] ?? config.serverName;

  const tickets = await prisma.ticket.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { messages: true } } },
  });

  return (
    <SiteShell serverName={name} logo={settings["server.logo"] ?? null} discordUrl={settings["server.discordUrl"] ?? config.discordUrl}>
      <div className="container-page py-12">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Link href="/konto" className="text-sm text-ink-soft hover:text-ink">← Konto</Link>
            <h1 className="mt-1 font-display text-3xl font-bold">Tickety</h1>
          </div>
        </div>
        <TicketList tickets={tickets.map((t) => ({ publicId: t.publicId, subject: t.subject, category: t.category, status: t.status, _count: { messages: t._count.messages }, updatedAt: t.updatedAt.toISOString() }))} />
      </div>
    </SiteShell>
  );
}
