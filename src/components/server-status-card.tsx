"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { cn, formatNumber } from "@/lib/utils";

interface StatusData {
  online: boolean;
  players: number;
  maxPlayers: number;
  version: string | null;
  modes: { slug: string; name: string; online: boolean; players: number; maxPlayers: number }[];
}

async function fetchStatus(): Promise<StatusData> {
  const res = await fetch("/api/status/summary");
  if (!res.ok) throw new Error("status");
  return res.json();
}

export function ServerStatusCard({ ip, version }: { ip: string; version: string }) {
  const { data, isLoading } = useQuery({ queryKey: ["status-summary"], queryFn: fetchStatus, refetchInterval: 15000 });

  const online = data?.online ?? false;
  const players = data?.players ?? 0;
  const max = data?.maxPlayers ?? 0;

  return (
    <div className="card card-hover overflow-hidden">
      <div className="flex items-center justify-between border-b px-5 py-4">
        <div className="flex items-center gap-2.5">
          <span className={cn("relative flex h-2.5 w-2.5")}>
            {online && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ok/60" />}
            <span className={cn("relative inline-flex h-2.5 w-2.5 rounded-full", online ? "bg-ok" : "bg-bad")} />
          </span>
          <span className="text-sm font-medium">{online ? "Serwer online" : "Serwer offline"}</span>
        </div>
        <div className="text-xs text-ink-faint">{data?.version ?? version}</div>
      </div>
      <div className="grid grid-cols-2 gap-px bg-line">
        <div className="bg-bg-card px-5 py-4">
          <div className="text-xs text-ink-faint">Gracze online</div>
          <div className="stat">
            {isLoading ? "—" : formatNumber(players)}
            <span className="ml-1 text-base font-normal text-ink-faint">/ {isLoading ? "—" : formatNumber(max)}</span>
          </div>
        </div>
        <div className="bg-bg-card px-5 py-4">
          <div className="text-xs text-ink-faint">Adres IP</div>
          <CopyIpButton ip={ip} />
        </div>
      </div>
      {data?.modes && data.modes.length > 0 && (
        <div className="border-t px-5 py-3">
          <div className="mb-2 text-xs text-ink-faint">Tryby</div>
          <div className="flex flex-wrap gap-1.5">
            {data.modes.map((m) => (
              <span key={m.slug} className="chip">
                <span className={cn("h-1.5 w-1.5 rounded-full", m.online ? "bg-ok" : "bg-bad")} />
                {m.name}
                <span className="text-ink-faint">· {m.players}/{m.maxPlayers}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CopyIpButton({ ip }: { ip: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center gap-2 pt-1">
      <code className="font-mono text-sm text-ink">{ip}</code>
      <button
        onClick={async () => {
          await navigator.clipboard.writeText(ip);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
        className="btn-ghost !px-2 !py-1 !text-xs"
      >
        {copied ? "Skopiowano" : "Kopiuj"}
      </button>
    </div>
  );
}
