import { SiteShell } from "@/components/site-shell";
import { getPublicSettings } from "@/server/settings";
import { config } from "@/config/server";
import { prisma } from "@/server/db";
import { StatusGrid } from "@/components/status-grid";
import { isBotConfigured } from "@/server/discord";

export default async function StatusPage() {
  const settings = await getPublicSettings();
  const name = settings["server.name"] ?? config.serverName;

  const instances = await prisma.serverInstance.findMany({ include: { mode: true, history: { orderBy: { recordedAt: "desc" }, take: 60 } } });
  const botOk = isBotConfigured();
  const sbOk = instances.some((i) => i.storeBridgeOk);

  return (
    <SiteShell serverName={name} logo={settings["server.logo"] ?? null} discordUrl={settings["server.discordUrl"] ?? config.discordUrl}>
      <div className="container-page py-12">
        <div className="mb-10">
          <h1 className="font-display text-4xl font-bold">Status serwerów</h1>
          <p className="mt-2 text-ink-soft">Aktualny stan infrastruktury i usług.</p>
        </div>

        <StatusGrid
          instances={instances.map((i) => ({
            id: i.id,
            name: i.name,
            mode: i.mode?.name ?? null,
            online: i.online,
            players: i.players,
            maxPlayers: i.maxPlayers,
            tps: i.tps,
            mspt: i.mspt,
            pingMs: i.pingMs,
            uptimeSec: i.uptimeSec,
            version: i.version,
            lastRestartAt: i.lastRestartAt?.toISOString() ?? null,
            history: i.history.map((h) => ({ online: h.online, players: h.players, tps: h.tps, recordedAt: h.recordedAt.toISOString() })),
          }))}
          storeBridgeOk={sbOk}
          discordBotOk={botOk}
        />
      </div>
    </SiteShell>
  );
}
