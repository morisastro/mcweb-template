"use client";

import { SessionUser } from "@/server/auth";
import { DiscordAccount, MinecraftAccount } from "@prisma/client";
import { Check, Link2, Unlink } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

export function AccountView({
  user,
  discord,
  minecraft,
  playtime,
  totalSpent,
}: {
  user: SessionUser;
  discord: DiscordAccount | null;
  minecraft: MinecraftAccount | null;
  playtime: number;
  totalSpent: number;
}) {
  const router = useRouter();

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center">
        <Avatar user={user} minecraft={minecraft} />
        <div className="flex-1">
          <h2 className="font-display text-xl font-semibold">
            {minecraft?.username ?? discord?.username ?? user.displayName ?? "Gracz"}
          </h2>
          <div className="mt-1 flex flex-wrap gap-2">
            {minecraft && <span className="chip border-accent/30 text-accent">Minecraft</span>}
            {discord && <span className="chip border-accent/30 text-accent">Discord</span>}
            <span className="chip">{user.role}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-px border-t bg-line sm:grid-cols-2">
        <Row label="Nick Minecraft" value={minecraft?.username ?? "—"} connected={!!minecraft} href="/api/auth/discord" connectLabel="Połącz" />
        <Row label="UUID" value={minecraft?.uuid ?? "—"} mono />
        <Row label="Discord" value={discord?.username ?? "—"} connected={!!discord} href="/api/auth/discord" connectLabel="Połącz Discord" />
        <Row label="Discord ID" value={discord?.discordId ?? "—"} mono />
      </div>
    </div>
  );
}

function Avatar({ user, minecraft }: { user: SessionUser; minecraft: MinecraftAccount | null }) {
  if (minecraft?.skinUrl) {
    return <img src={minecraft.skinUrl} alt="" className="h-28 w-auto rounded-lg" />;
  }
  if (user.avatar) {
    return <img src={user.avatar} alt="" className="h-28 w-28 rounded-lg object-cover" />;
  }
  return <div className="grid h-28 w-28 place-items-center rounded-lg bg-accent/10 text-accent text-3xl">?</div>;
}

function Row({
  label,
  value,
  connected,
  href,
  connectLabel,
  mono,
}: {
  label: string;
  value: string;
  connected?: boolean;
  href?: string;
  connectLabel?: string;
  mono?: boolean;
}) {
  return (
    <div className="bg-bg-card px-6 py-4">
      <div className="text-xs text-ink-faint">{label}</div>
      <div className="mt-1 flex items-center gap-2">
        {connected !== undefined && (
          <span className={connected ? "text-ok" : "text-ink-faint"}>
            {connected ? <Check className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}
          </span>
        )}
        <span className={`text-sm ${mono ? "font-mono" : ""} truncate`}>{value}</span>
        {!connected && href && (
          <a href={href} className="ml-auto text-xs text-accent hover:underline">
            {connectLabel}
          </a>
        )}
      </div>
    </div>
  );
}
