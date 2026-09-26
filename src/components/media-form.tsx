"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Youtube, Twitch, Music2, Globe } from "lucide-react";

const PLATFORMS = [
  { id: "YOUTUBE", label: "YouTube", icon: <Youtube className="h-4 w-4" /> },
  { id: "TIKTOK", label: "TikTok", icon: <Music2 className="h-4 w-4" /> },
  { id: "TWITCH", label: "Twitch", icon: <Twitch className="h-4 w-4" /> },
  { id: "OTHER", label: "Inne", icon: <Globe className="h-4 w-4" /> },
];

export function MediaForm() {
  const [platform, setPlatform] = useState("YOUTUBE");
  const [form, setForm] = useState({ profileUrl: "", followers: 0, avgViews: 0, contentUrl: "", message: "" });
  const [done, setDone] = useState(false);

  const mut = useMutation({
    mutationFn: async (payload: unknown) => {
      const res = await fetch("/api/media", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      return d;
    },
    onSuccess: () => { setDone(true); setForm({ profileUrl: "", followers: 0, avgViews: 0, contentUrl: "", message: "" }); },
  });

  if (done) {
    return (
      <div className="card p-6 text-center">
        <div className="text-ok">Zgłoszenie wysłane. Otrzymasz odpowiedź w panelu konta.</div>
        <button onClick={() => setDone(false)} className="btn-ghost mt-4">Nowe zgłoszenie</button>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); mut.mutate({ platform, ...form }); }}
      className="card space-y-4 p-6"
    >
      <div>
        <div className="label">Platforma</div>
        <div className="flex flex-wrap gap-2">
          {PLATFORMS.map((p) => (
            <button key={p.id} type="button" onClick={() => setPlatform(p.id)}
              className={`chip ${platform === p.id ? "border-accent bg-accent/15 text-accent" : ""}`}>
              {p.icon} {p.label}
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Link do profilu"><input className="input" required value={form.profileUrl} onChange={(e) => setForm({ ...form, profileUrl: e.target.value })} placeholder="https://youtube.com/@" /></Field>
        <Field label="Liczba obserwujących"><input type="number" min={0} className="input" value={form.followers} onChange={(e) => setForm({ ...form, followers: +e.target.value })} /></Field>
        <Field label="Średnia liczba wyświetleń"><input type="number" min={0} className="input" value={form.avgViews} onChange={(e) => setForm({ ...form, avgViews: +e.target.value })} /></Field>
        <Field label="Link do materiału z serwera"><input className="input" required value={form.contentUrl} onChange={(e) => setForm({ ...form, contentUrl: e.target.value })} placeholder="https://…" /></Field>
      </div>
      <Field label="Dodatkowa wiadomość"><textarea className="input min-h-24" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} /></Field>
      {mut.error && <p className="text-xs text-bad">{(mut.error as Error).message}</p>}
      <button disabled={mut.isPending} className="btn-primary">Wyślij zgłoszenie</button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="label">{label}</label>{children}</div>;
}
