"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Check } from "lucide-react";

const ACCENTS = [
  { name: "Fiolet", rgb: "138 99 255" },
  { name: "Cyjan", rgb: "56 189 248" },
  { name: "Zielony", rgb: "72 209 154" },
  { name: "Różowy", rgb: "236 72 153" },
  { name: "Pomarańcz", rgb: "249 115 22" },
];

export default function UstawieniaPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin", "settings"], queryFn: async () => (await fetch("/api/admin/settings")).json() });
  const [form, setForm] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  const merged = { ...data, ...form };

  const save = useMutation({
    mutationFn: async (payload: Record<string, string>) => {
      const res = await fetch("/api/admin/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error("Błąd");
      return res.json();
    },
    onSuccess: () => { setSaved(true); setForm({}); qc.invalidateQueries({ queryKey: ["admin", "settings"] }); setTimeout(() => setSaved(false), 2000); },
  });

  if (isLoading) return <div className="text-ink-faint">Ładowanie…</div>;

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="font-display text-2xl font-bold">Ustawienia</h1>

      <Section title="Serwer">
        <F label="Nazwa serwera"><input className="input" value={merged["server.name"] ?? ""} onChange={(e) => set("serverName", e.target.value)} /></F>
        <F label="IP Minecraft"><input className="input" value={merged["server.minecraftIp"] ?? ""} onChange={(e) => set("minecraftIp", e.target.value)} /></F>
        <F label="Wersja"><input className="input" value={merged["server.minecraftVersion"] ?? ""} onChange={(e) => set("minecraftVersion", e.target.value)} /></F>
        <F label="Opis"><textarea className="input min-h-20" value={merged["server.description"] ?? ""} onChange={(e) => set("description", e.target.value)} /></F>
        <F label="Logo (URL)"><input className="input" value={merged["server.logo"] ?? ""} onChange={(e) => set("logo", e.target.value)} /></F>
        <F label="Link Discord"><input className="input" value={merged["server.discordUrl"] ?? ""} onChange={(e) => set("discordUrl", e.target.value)} /></F>
        <F label="Waluta"><input className="input" value={merged["server.currency"] ?? "PLN"} onChange={(e) => set("currency", e.target.value)} /></F>
      </Section>

      <Section title="Wygląd">
        <F label="Kolor akcentu">
          <div className="flex flex-wrap gap-2">
            {ACCENTS.map((a) => (
              <button key={a.rgb} type="button" onClick={() => set("accentColor", a.rgb)} className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${(merged["server.accentColor"] ?? "138 99 255") === a.rgb ? "border-accent" : ""}`}>
                <span className="h-4 w-4 rounded-full" style={{ background: `rgb(${a.rgb})` }} /> {a.name}
              </button>
            ))}
          </div>
        </F>
      </Section>

      <Section title="Discord webhooki">
        <F label="Webhook zakupów"><input className="input" placeholder="https://discord.com/api/webhooks/…" value={merged["discord.webhook.purchase"] ?? ""} onChange={(e) => set("discordPurchaseWebhook", e.target.value)} /></F>
        <F label="Webhook błędów realizacji"><input className="input" placeholder="https://discord.com/api/webhooks/…" value={merged["discord.webhook.error"] ?? ""} onChange={(e) => set("discordErrorWebhook", e.target.value)} /></F>
        <F label="Webhook nowych ticketów"><input className="input" placeholder="https://discord.com/api/webhooks/…" value={merged["discord.webhook.ticket"] ?? ""} onChange={(e) => set("discordTicketWebhook", e.target.value)} /></F>
      </Section>

      <div className="flex items-center gap-3">
        <button onClick={() => save.mutate(form)} disabled={save.isPending || !Object.keys(form).length} className="btn-primary">
          {save.isPending ? "Zapisywanie…" : "Zapisz ustawienia"}
        </button>
        {saved && <span className="inline-flex items-center gap-1 text-sm text-ok"><Check className="h-4 w-4" /> Zapisano</span>}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="card space-y-4 p-6"><h2 className="font-display font-semibold">{title}</h2><div className="space-y-4">{children}</div></div>;
}
function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="label">{label}</label>{children}</div>;
}
