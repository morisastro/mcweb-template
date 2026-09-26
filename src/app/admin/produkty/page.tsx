"use client";

import { useQuery } from "@tanstack/react-query";
import { ResourceManager, type Field } from "@/components/admin/resource-manager";
import { formatPLN } from "@/lib/utils";

async function fetchOpts(key: string) {
  const res = await fetch(`/api/admin/${key}`);
  return res.json();
}

export default function ProduktyPage() {
  const { data: modes } = useQuery({ queryKey: ["admin", "modes"], queryFn: () => fetchOpts("modes") });
  const { data: cats } = useQuery({ queryKey: ["admin", "categories"], queryFn: () => fetchOpts("categories") });

  const fields: Field[] = [
    { name: "slug", label: "Slug", type: "text", default: "" },
    { name: "name", label: "Nazwa", type: "text", default: "" },
    { name: "description", label: "Opis", type: "textarea", default: "" },
    { name: "price", label: "Cena (PLN)", type: "number", step: "0.01", default: 0 },
    { name: "oldPrice", label: "Stara cena (opcjonalnie)", type: "number", step: "0.01", default: 0 },
    { name: "icon", label: "Ikona", type: "text", default: "📦" },
    { name: "modeId", label: "Tryb", type: "select", options: (modes ?? []).map((m: any) => ({ value: m.id, label: m.name })) },
    { name: "categoryId", label: "Kategoria", type: "select", options: (cats ?? []).map((c: any) => ({ value: c.id, label: c.name })) },
    { name: "commands", label: "Komendy (po przecinku, {player}=nick)", type: "list", default: [] },
    { name: "duration", label: "Czas trwania (np. 30d)", type: "text", default: "" },
    { name: "featured", label: "Polecany", type: "boolean", default: false },
    { name: "active", label: "Aktywny", type: "boolean", default: true },
    { name: "sort", label: "Kolejność", type: "number", default: 0 },
  ];

  return (
    <ResourceManager
      title="Produkty"
      resource="products"
      fields={fields}
      columns={[
        { key: "icon", label: "", render: (r) => <span className="text-xl">{r.icon}</span> },
        { key: "name", label: "Nazwa" },
        { key: "mode", label: "Tryb", render: (r) => r.mode?.name ?? "—" },
        { key: "category", label: "Kategoria", render: (r) => r.category?.name ?? "—" },
        { key: "price", label: "Cena", render: (r) => formatPLN(r.price) },
        { key: "active", label: "Aktywny", render: (r) => (r.active ? "Tak" : "Nie") },
      ]}
    />
  );
}
