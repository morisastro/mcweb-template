import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { config } from "@/config/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const instances = await prisma.serverInstance.findMany({
    include: { mode: true },
  });

  const proxy = instances.find((i) => i.name.toLowerCase().includes("proxy"));
  const modeInstances = instances.filter((i) => !i.name.toLowerCase().includes("proxy"));

  const online = proxy?.online ?? modeInstances.some((i) => i.online);
  const players = instances.reduce((s, i) => s + i.players, 0);
  const maxPlayers = instances.reduce((s, i) => s + (i.maxPlayers || 0), 0) || proxy?.maxPlayers || 0;

  const modes = await prisma.serverMode.findMany({
    where: { visible: true },
    orderBy: { order: "asc" },
  });

  const modeStatus = modes.map((m) => {
    const inst = modeInstances.find((i) => i.modeId === m.id);
    return {
      slug: m.slug,
      name: m.name,
      online: inst?.online ?? false,
      players: inst?.players ?? 0,
      maxPlayers: inst?.maxPlayers ?? 0,
    };
  });

  return NextResponse.json({
    online,
    players,
    maxPlayers,
    version: proxy?.version ?? config.minecraftVersion,
    modes: modeStatus,
  });
}
