"use client";

import { ResourceManager, type Field } from "@/components/admin/resource-manager";

const fields: Field[] = [
  { name: "slug", label: "Slug (URL)", type: "text", placeholder: "boxpvp", default: "" },
  { name: "name", label: "Nazwa", type: "text", default: "" },
  { name: "description", label: "Opis", type: "textarea", default: "" },
  { name: "icon", label: "Ikona (emoji)", type: "text", default: "🎮" },
  { name: "order", label: "Kolejność", type: "number", default: 0 },
  { name: "visible", label: "Widoczny", type: "boolean", default: true },
];

export default function TrybyPage() {
  return (
    <ResourceManager
      title="Tryby"
      resource="modes"
      fields={fields}
      columns={[
        { key: "icon", label: "", render: (r) => <span className="text-xl">{r.icon}</span> },
        { key: "name", label: "Nazwa" },
        { key: "slug", label: "Slug" },
        { key: "order", label: "Kolejność" },
        { key: "visible", label: "Widoczny", render: (r) => (r.visible ? "Tak" : "Nie") },
      ]}
    />
  );
}
