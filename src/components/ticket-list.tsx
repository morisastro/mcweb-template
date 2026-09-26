"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

interface Item {
  publicId: string;
  subject: string;
  category: string;
  status: string;
  _count: { messages: number };
  updatedAt: string;
}

const CAT_LABEL: Record<string, string> = {
  POMOC: "Pomoc", ZAKUP: "Zakup", BAN_APPEAL: "Ban Appeal", BUG: "Bug", WSPOLPRACA: "Współpraca", INNE: "Inne",
};
const STATUS_COLOR: Record<string, string> = {
  OPEN: "text-ok", WAITING_FOR_USER: "text-warn", WAITING_FOR_STAFF: "text-accent", CLOSED: "text-ink-faint",
};

export function TicketList({ tickets }: { tickets: Item[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ subject: "", category: "POMOC", description: "" });

  const create = useMutation({
    mutationFn: async (p: typeof form) => {
      const res = await fetch("/api/tickets", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(p) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      return d;
    },
    onSuccess: (d) => { setOpen(false); router.push(`/konto/tickety/${d.publicId}`); },
  });

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <button onClick={() => setOpen((v) => !v)} className="btn-primary">{open ? "Anuluj" : "Nowy ticket"}</button>
      </div>

      {open && (
        <form onSubmit={(e) => { e.preventDefault(); create.mutate(form); }} className="card mb-6 space-y-3 p-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <div><label className="label">Temat</label><input className="input" required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></div>
            <div><label className="label">Kategoria</label>
              <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {Object.entries(CAT_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>
          <div><label className="label">Opis</label><textarea className="input min-h-28" required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          {create.error && <p className="text-xs text-bad">{(create.error as Error).message}</p>}
          <button className="btn-primary">Wyślij</button>
        </form>
      )}

      {tickets.length === 0 ? (
        <div className="card p-12 text-center text-ink-faint">Brak ticketów. Utwórz pierwszy, jeśli potrzebujesz pomocy.</div>
      ) : (
        <div className="space-y-2">
          {tickets.map((t) => (
            <button key={t.publicId} onClick={() => router.push(`/konto/tickety/${t.publicId}`)} className="card card-hover flex w-full items-center justify-between p-4 text-left">
              <div>
                <div className="font-medium">{t.subject}</div>
                <div className="text-xs text-ink-faint">{CAT_LABEL[t.category]} · {t._count.messages} wiadomości</div>
              </div>
              <span className={cn("text-sm font-medium", STATUS_COLOR[t.status])}>{t.status.replace(/_/g, " ")}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
