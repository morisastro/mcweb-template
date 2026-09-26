"use client";

import { useQuery } from "@tanstack/react-query";
import { ResourceManager, type Field } from "@/components/admin/resource-manager";
import { formatPLN } from "@/lib/utils";

export default function KodyPage() {
  const { data: modes } = useQuery({ queryKey: ["admin", "modes"], queryFn: async () => (await fetch("/api/admin/modes")).json() });
  const { data: products } = useQuery({ queryKey: ["admin", "products"], queryFn: async () => (await fetch("/api/admin/products")).json() });

  const fields: Field[] = [
    { name: "code", label: "Kod", type: "text", default: "" },
    { name: "description", label: "Opis", type: "text", default: "" },
    { name: "type", label: "Typ", type: "select", options: [{ value: "PERCENT", label: "Procentowy" }, { value: "AMOUNT", label: "Kwotowy (PLN)" }], default: "PERCENT" },
    { name: "value", label: "Wartość", type: "number", step: "0.01", default: 10 },
    { name: "usageLimit", label: "Limit użyć", type: "number", default: 0 },
    { name: "active", label: "Aktywny", type: "boolean", default: true },
    { name: "modeIds", label: "Ograniczenie trybów (ID po przecinku)", type: "list", default: [] },
    { name: "productIds", label: "Ograniczenie produktów (ID po przecinku)", type: "list", default: [] },
  ];

  return (
    <ResourceManager
      title="Kody rabatowe"
      resource="coupons"
      fields={fields}
      columns={[
        { key: "code", label: "Kod", render: (r) => <code className="font-mono text-accent">{r.code}</code> },
        { key: "type", label: "Typ", render: (r) => (r.type === "PERCENT" ? `${r.value}%` : formatPLN(r.value)) },
        { key: "usedCount", label: "Użycia", render: (r) => `${r.usedCount}${r.usageLimit ? "/" + r.usageLimit : ""}` },
        { key: "active", label: "Aktywny", render: (r) => (r.active ? "Tak" : "Nie") },
      ]}
    />
  );
}
