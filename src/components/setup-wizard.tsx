"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = ["Serwer", "Wygląd", "Discord", "Admin", "Paynow", "Tryb", "Produkt"] as const;

const ACCENTS = [
  { name: "Fiolet", rgb: "138 99 255" },
  { name: "Cyjan", rgb: "56 189 248" },
  { name: "Zielony", rgb: "72 209 154" },
  { name: "Różowy", rgb: "236 72 153" },
  { name: "Pomarańcz", rgb: "249 115 22" },
  { name: "Czerwony", rgb: "240 96 110" },
];

export function SetupWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [data, setData] = useState({
    serverName: "MythCraft",
    minecraftIp: "play.mythcraft.pl",
    minecraftVersion: "1.21.4",
    accentColor: "138 99 255",
    logo: "",
    discordUrl: "",
    description: "Nowoczesny serwer Minecraft z unikalnymi trybami.",
    adminUsername: "admin",
    adminPassword: "",
    paynowEnv: "mock" as "mock" | "sandbox" | "production",
    modeName: "BoxPvP",
    modeSlug: "boxpvp",
    productName: "VIP",
    productPrice: 19.99,
  });

  const submit = useMutation({
    mutationFn: async (payload: typeof data) => {
      const res = await fetch("/api/setup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      return d;
    },
    onSuccess: () => router.push("/admin"),
  });

  const next = () => setStep((s) => Math.min(STEPS.length - 1, s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));
  const set = (k: keyof typeof data, v: string | number) => setData((p) => ({ ...p, [k]: v }));

  return (
    <div className="card p-6">
      {/* progress */}
      <div className="mb-6 flex items-center gap-1.5">
        {STEPS.map((_, i) => (
          <div key={i} className={cn("h-1 flex-1 rounded-full transition", i <= step ? "bg-accent" : "bg-line")} />
        ))}
      </div>

      <div className="min-h-48">
        {step === 0 && (
          <Section title="Informacje o serwerze">
            <F label="Nazwa serwera"><input className="input" value={data.serverName} onChange={(e) => set("serverName", e.target.value)} /></F>
            <F label="IP Minecraft"><input className="input" value={data.minecraftIp} onChange={(e) => set("minecraftIp", e.target.value)} /></F>
            <F label="Wersja Minecraft"><input className="input" value={data.minecraftVersion} onChange={(e) => set("minecraftVersion", e.target.value)} /></F>
            <F label="Opis"><textarea className="input min-h-20" value={data.description} onChange={(e) => set("description", e.target.value)} /></F>
          </Section>
        )}
        {step === 1 && (
          <Section title="Wygląd">
            <F label="Kolor akcentu">
              <div className="flex flex-wrap gap-2">
                {ACCENTS.map((a) => (
                  <button key={a.rgb} type="button" onClick={() => set("accentColor", a.rgb)} className={cn("flex items-center gap-2 rounded-lg border px-3 py-2 text-sm", data.accentColor === a.rgb ? "border-accent" : "")}>
                    <span className="h-4 w-4 rounded-full" style={{ background: `rgb(${a.rgb})` }} /> {a.name}
                  </button>
                ))}
              </div>
            </F>
            <F label="Logo (URL, opcjonalnie)"><input className="input" placeholder="https://…" value={data.logo} onChange={(e) => set("logo", e.target.value)} /></F>
          </Section>
        )}
        {step === 2 && (
          <Section title="Discord">
            <F label="Link do Discord (opcjonalnie)"><input className="input" placeholder="https://discord.gg/…" value={data.discordUrl} onChange={(e) => set("discordUrl", e.target.value)} /></F>
            <p className="text-xs text-ink-faint">OAuth logowanie wymaga DISCORD_CLIENT_ID i DISCORD_CLIENT_SECRET w pliku .env.</p>
          </Section>
        )}
        {step === 3 && (
          <Section title="Konto administratora">
            <F label="Login admina"><input className="input" value={data.adminUsername} onChange={(e) => set("adminUsername", e.target.value)} /></F>
            <F label="Hasło (min. 8 znaków)"><input type="password" className="input" value={data.adminPassword} onChange={(e) => set("adminPassword", e.target.value)} /></F>
          </Section>
        )}
        {step === 4 && (
          <Section title="Paynow">
            <F label="Środowisko">
              <select className="input" value={data.paynowEnv} onChange={(e) => set("paynowEnv", e.target.value)}>
                <option value="mock">Mock (test lokalny)</option>
                <option value="sandbox">Sandbox</option>
                <option value="production">Produkcja</option>
              </select>
            </F>
            <p className="text-xs text-ink-faint">
              Mock działa bez kluczy — pozwala przetestować cały proces zakupu lokalnie.<br />
              <strong className="text-ink-soft">Sandbox/Produkcja:</strong> klucze <code className="font-mono">PAYNOW_API_KEY</code> i <code className="font-mono">PAYNOW_API_SECRET</code> muszą być w pliku <code className="font-mono">.env</code> (sekrety nie przechodzą przez przeglądarkę).
            </p>
          </Section>
        )}
        {step === 5 && (
          <Section title="Pierwszy tryb">
            <F label="Nazwa trybu"><input className="input" value={data.modeName} onChange={(e) => set("modeName", e.target.value)} /></F>
            <F label="Slug (URL)"><input className="input" value={data.modeSlug} onChange={(e) => set("modeSlug", e.target.value.toLowerCase().replace(/\s+/g, "-"))} /></F>
          </Section>
        )}
        {step === 6 && (
          <Section title="Pierwszy produkt">
            <F label="Nazwa produktu"><input className="input" value={data.productName} onChange={(e) => set("productName", e.target.value)} /></F>
            <F label="Cena (PLN)"><input type="number" step="0.01" className="input" value={data.productPrice} onChange={(e) => set("productPrice", +e.target.value)} /></F>
            <p className="text-xs text-ink-faint">Produkt zostanie dodany do trybu {data.modeName} w kategorii Rangi.</p>
          </Section>
        )}
      </div>

      {submit.error && <p className="mt-3 text-sm text-bad">{(submit.error as Error).message}</p>}

      <div className="mt-6 flex items-center justify-between">
        <button onClick={back} disabled={step === 0} className="btn-ghost">Wstecz</button>
        {step < STEPS.length - 1 ? (
          <button onClick={next} className="btn-primary">Dalej</button>
        ) : (
          <button onClick={() => submit.mutate(data)} disabled={submit.isPending || !data.adminPassword} className="btn-primary">
            {submit.isPending ? "Zapisywanie…" : "Zakończ konfigurację"}
          </button>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="animate-fade-in space-y-4">
      <h2 className="font-display text-xl font-semibold">{title}</h2>
      {children}
    </div>
  );
}
function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="label">{label}</label>{children}</div>;
}
