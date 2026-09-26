"use client";

import { ResourceManager, type Field } from "@/components/admin/resource-manager";

const TYPES = [
  "DISCORD_LINK", "MC_LINK", "BOTH_LINK", "BOOST", "PLAYTIME", "DAILY", "EVENT", "PROMO_CODE", "MEDIA", "CUSTOM",
].map((t) => ({ value: t, label: t.replace(/_/g, " ") }));

const fields: Field[] = [
  { name: "slug", label: "Slug", type: "text", default: "" },
  { name: "name", label: "Nazwa", type: "text", default: "" },
  { name: "description", label: "Opis", type: "textarea", default: "" },
  { name: "type", label: "Typ", type: "select", options: TYPES, default: "CUSTOM" },
  { name: "icon", label: "Ikona", type: "text", default: "🎁" },
  { name: "requirement", label: "Wymagania (JSON, np. minutes:120)", type: "textarea", default: {} },
  { name: "commands", label: "Komendy Minecraft (po przecinku)", type: "list", default: [] },
  { name: "discordRoleIds", label: "Role Discord (ID po przecinku)", type: "list", default: [] },
  { name: "claimLimit", label: "Limit odebrań", type: "number", default: 1 },
  { name: "order", label: "Kolejność", type: "number", default: 0 },
  { name: "active", label: "Aktywna", type: "boolean", default: true },
];

export default function NagrodyAdminPage() {
  return (
    <ResourceManager
      title="Nagrody"
      resource="rewards"
      fields={fields}
      columns={[
        { key: "icon", label: "", render: (r) => <span className="text-xl">{r.icon}</span> },
        { key: "name", label: "Nazwa" },
        { key: "type", label: "Typ", render: (r) => r.type?.replace(/_/g, " ") ?? "—" },
        { key: "active", label: "Aktywna", render: (r) => (r.active ? "Tak" : "Nie") },
        { key: "_count", label: "Odebrania", render: (r) => r._count?.claims ?? 0 },
      ]}
    />
  );
}
