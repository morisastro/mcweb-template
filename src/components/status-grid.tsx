"use client";

import { cn, durationLabel } from "@/lib/utils";
import { Activity, Bot, Cpu, Gauge, Plug, Server } from "lucide-react";
import { timeAgo } from "@/lib/utils";

interface Instance {
  id: string;
  name: string;
  mode: string | null;
  online: boolean;
  players: number;
  maxPlayers: number;
  tps: number | null;
  mspt: number | null;
  pingMs: number | null;
  uptimeSec: number;
  version: string | null;
  lastRestartAt: string | null;
  history: { online: boolean; players: number; tps: number | null; recordedAt: string }[];
}

export function StatusGrid({ instances, storeBridgeOk, discordBotOk }: { instances: Instance[]; storeBridgeOk: boolean; discordBotOk: boolean }) {
  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <ServiceCard icon={<Plug className="h-4 w-4" />} label="StoreBridge" ok={storeBridgeOk} />
        <ServiceCard icon={<Bot className="h-4 w-4" />} label="Discord Bot" ok={discordBotOk} />
        <ServiceCard icon={<Server className="h-4 w-4" />} label="Serwery" ok={instances.some((i) => i.online)} />
      </div>

      {instances.length === 0 ? (
        <div className="card p-12 text-center text-ink-faint">Brak skonfigurowanych instancji. Dodaj je w panelu admina.</div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {instances.map((i) => (
            <div key={i.id} className="card p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={cn("relative flex h-2.5 w-2.5")}>
                    {i.online && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ok/60" />}
                    <span className={cn("relative inline-flex h-2.5 w-2.5 rounded-full", i.online ? "bg-ok" : "bg-bad")} />
                  </span>
                  <span className="font-display font-semibold">{i.name}</span>
                  {i.mode && <span className="chip !py-0.5">{i.mode}</span>}
                </div>
                <span className={cn("text-sm font-medium", i.online ? "text-ok" : "text-bad")}>{i.online ? "Online" : "Offline"}</span>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <Metric icon={<Server className="h-3.5 w-3.5" />} label="Gracze" value={`${i.players}/${i.maxPlayers}`} />
                <Metric icon={<Gauge className="h-3.5 w-3.5" />} label="TPS" value={i.tps != null ? i.tps.toFixed(1) : "—"} />
                <Metric icon={<Activity className="h-3.5 w-3.5" />} label="Ping" value={i.pingMs != null ? `${i.pingMs}ms` : "—"} />
                <Metric icon={<Cpu className="h-3.5 w-3.5" />} label="MSPT" value={i.mspt != null ? i.mspt.toFixed(2) : "—"} />
                <Metric icon={<Server className="h-3.5 w-3.5" />} label="Uptime" value={durationLabel(i.uptimeSec)} />
                <Metric icon={<Activity className="h-3.5 w-3.5" />} label="Wersja" value={i.version ?? "—"} />
              </div>

              {i.lastRestartAt && <div className="mt-4 text-xs text-ink-faint">Ostatni restart: {timeAgo(i.lastRestartAt)}</div>}

              {/* uptime bars */}
              {i.history.length > 0 && (
                <div className="mt-4">
                  <div className="mb-1.5 text-xs text-ink-faint">Historia uptime</div>
                  <div className="flex h-8 gap-0.5">
                    {i.history.slice().reverse().map((h, idx) => (
                      <div key={idx} title={`${new Date(h.recordedAt).toLocaleTimeString("pl-PL")} · ${h.online ? "online" : "offline"} · ${h.players}`} className={cn("flex-1 rounded-sm", h.online ? "bg-ok/60" : "bg-bad/40")} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ServiceCard({ icon, label, ok }: { icon: React.ReactNode; label: string; ok: boolean }) {
  return (
    <div className="card flex items-center gap-3 p-5">
      <div className={cn("grid h-10 w-10 place-items-center rounded-lg", ok ? "bg-ok/10 text-ok" : "bg-bad/10 text-bad")}>{icon}</div>
      <div>
        <div className="text-sm font-medium">{label}</div>
        <div className={cn("text-xs", ok ? "text-ok" : "text-bad")}>{ok ? "Działa" : "Niedostępny"}</div>
      </div>
    </div>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-bg-soft/40 p-2.5">
      <div className="flex items-center justify-center gap-1 text-[10px] text-ink-faint">{icon}{label}</div>
      <div className="mt-0.5 font-display text-sm font-semibold">{value}</div>
    </div>
  );
}
