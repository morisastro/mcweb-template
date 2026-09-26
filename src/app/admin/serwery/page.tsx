"use client";

import { ResourceManager, type Field } from "@/components/admin/resource-manager";
import { useQuery } from "@tanstack/react-query";

export default function SerweryPage() {
  const { data: modes } = useQuery({ queryKey: ["admin", "modes"], queryFn: async () => (await fetch("/api/admin/modes")).json() });

  const fields: Field[] = [
    { name: "name", label: "Nazwa (np. proxy, boxpvp-1)", type: "text", default: "" },
    { name: "modeId", label: "Tryb", type: "select", options: (modes ?? []).map((m: any) => ({ value: m.id, label: m.name })) },
    { name: "host", label: "Host", type: "text", default: "" },
    { name: "port", label: "Port", type: "number", default: 25565 },
  ];

  return (
    <ResourceManager
      title="Serwery"
      resource="servers"
      fields={fields}
      columns={[
        { key: "name", label: "Nazwa" },
        { key: "mode", label: "Tryb", render: (r) => r.mode?.name ?? "—" },
        { key: "host", label: "Host", render: (r) => `${r.host}:${r.port}` },
        { key: "online", label: "Status", render: (r) => (r.online ? <span className="text-ok">online</span> : <span className="text-bad">offline</span>) },
        { key: "players", label: "Gracze", render: (r) => `${r.players}/${r.maxPlayers}` },
      ]}
    />
  );
}
