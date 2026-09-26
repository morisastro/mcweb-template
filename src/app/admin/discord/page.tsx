"use client";

import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

export default function DiscordAdminPage() {
  const { data: settings } = useQuery({ queryKey: ["admin", "settings"], queryFn: async () => (await fetch("/api/admin/settings")).json() });
  const { data: env } = useQuery({ queryKey: ["discord-env"], queryFn: async () => (await fetch("/api/admin/discord/status")).json() });

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Discord</h1>

      <div className="grid gap-4 sm:grid-cols-3">
        <Status label="OAuth" ok={!!env?.oauth} />
        <Status label="Bot" ok={!!env?.bot} />
        <Status label="Guild" ok={!!env?.guild} />
      </div>

      <div className="card p-6">
        <h2 className="mb-4 font-display font-semibold">Webhooki</h2>
        <div className="space-y-3">
          <p className="text-sm text-ink-soft">Skonfiguruj webhooki w ustawieniach, aby otrzymywać powiadomienia o zakupach, błędach realizacji i nowych ticketach.</p>
          <div className="grid gap-2 text-sm">
            <div className="flex items-center justify-between rounded-lg border bg-bg-soft/40 px-3 py-2">
              <span className="text-ink-soft">Webhook zakupów</span>
              <code className="text-xs text-ink-faint">{settings?.["discord.webhook.purchase"] ? "skonfigurowany" : "—"}</code>
            </div>
            <div className="flex items-center justify-between rounded-lg border bg-bg-soft/40 px-3 py-2">
              <span className="text-ink-soft">Webhook błędów</span>
              <code className="text-xs text-ink-faint">{settings?.["discord.webhook.error"] ? "skonfigurowany" : "—"}</code>
            </div>
            <div className="flex items-center justify-between rounded-lg border bg-bg-soft/40 px-3 py-2">
              <span className="text-ink-soft">Webhook ticketów</span>
              <code className="text-xs text-ink-faint">{settings?.["discord.webhook.ticket"] ? "skonfigurowany" : "—"}</code>
            </div>
          </div>
          <p className="text-xs text-ink-faint">Konfiguruj webhooki w zakładce Ustawienia. Role po zakupie/Media synchronizowane automatycznie przez bota.</p>
        </div>
      </div>
    </div>
  );
}

function Status({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="card flex items-center gap-3 p-5">
      <span className={cn("h-2.5 w-2.5 rounded-full", ok ? "bg-ok" : "bg-bad")} />
      <div>
        <div className="text-sm font-medium">{label}</div>
        <div className={cn("text-xs", ok ? "text-ok" : "text-bad")}>{ok ? "Skonfigurowany" : "Brak"}</div>
      </div>
    </div>
  );
}
