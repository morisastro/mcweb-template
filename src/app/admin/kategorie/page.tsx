"use client";

import { ResourceManager, type Field } from "@/components/admin/resource-manager";

const fields: Field[] = [
  { name: "slug", label: "Slug", type: "text", default: "" },
  { name: "name", label: "Nazwa", type: "text", default: "" },
  { name: "description", label: "Opis", type: "textarea", default: "" },
  { name: "icon", label: "Ikona", type: "text", default: "📦" },
  { name: "order", label: "Kolejność", type: "number", default: 0 },
];

export default function KategoriePage() {
  return (
    <ResourceManager
      title="Kategorie"
      resource="categories"
      fields={fields}
      columns={[
        { key: "icon", label: "", render: (r) => <span className="text-xl">{r.icon}</span> },
        { key: "name", label: "Nazwa" },
        { key: "slug", label: "Slug" },
        { key: "order", label: "Kolejność" },
      ]}
    />
  );
}
