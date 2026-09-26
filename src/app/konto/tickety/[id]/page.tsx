import { SiteShell } from "@/components/site-shell";
import { getPublicSettings } from "@/server/settings";
import { config } from "@/config/server";
import { getSessionUser } from "@/server/auth";
import { prisma } from "@/server/db";
import { redirect } from "next/navigation";
import { TicketConversation } from "@/components/ticket-conversation";
import Link from "next/link";

export default async function TicketDetailPage({ params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const settings = await getPublicSettings();
  const name = settings["server.name"] ?? config.serverName;

  const ticket = await prisma.ticket.findUnique({
    where: { publicId: params.id },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
  if (!ticket || (ticket.userId !== user.id && user.role === "USER")) redirect("/konto/tickety");

  return (
    <SiteShell serverName={name} logo={settings["server.logo"] ?? null} discordUrl={settings["server.discordUrl"] ?? config.discordUrl}>
      <div className="container-page py-12">
        <Link href="/konto/tickety" className="mb-4 inline-flex text-sm text-ink-soft hover:text-ink">← Moje tickety</Link>
        <TicketConversation
          publicId={ticket.publicId}
          subject={ticket.subject}
          status={ticket.status}
          messages={ticket.messages.map((m) => ({
            id: m.id,
            authorId: m.authorId,
            authorRole: m.authorRole,
            body: m.body,
            attachments: m.attachments,
            createdAt: m.createdAt.toISOString(),
          }))}
          currentUserId={user.id}
        />
      </div>
    </SiteShell>
  );
}
