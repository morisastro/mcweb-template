"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Pencil, Plus, Trash2, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Field {
  name: string;
  label: string;
  type?: "text" | "number" | "textarea" | "select" | "boolean" | "list";
  options?: { value: string; label: string }[];
  default?: unknown;
  placeholder?: string;
  step?: string;
}

interface Column {
  key: string;
  label: string;
  render?: (row: any) => React.ReactNode;
}

export function ResourceManager({
  title,
  resource,
  fields,
  columns,
}: {
  title: string;
  resource: string; // e.g. "modes"
  fields: Field[];
  columns: Column[];
}) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<any | null>(null);
  const [open, setOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", resource],
    queryFn: async () => (await fetch(`/api/admin/${resource}`)).json(),
  });

  const create = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch(`/api/admin/${resource}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Błąd");
      return d;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", resource] }); setOpen(false); setEditing(null); },
  });

  const update = useMutation({
    mutationFn: async ({ id, ...payload }: any) => {
      const res = await fetch(`/api/admin/${resource}/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Błąd");
      return d;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", resource] }); setOpen(false); setEditing(null); },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/${resource}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Błąd");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", resource] }),
  });

  const blank = () => Object.fromEntries(fields.map((f) => [f.name, f.default ?? (f.type === "list" ? [] : f.type === "boolean" ? false : f.type === "number" ? 0 : "")]));

  const submit = (form: any) => {
    if (editing?.id) update.mutate({ id: editing.id, ...form });
    else create.mutate(form);
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">{title}</h1>
        <button onClick={() => { setEditing(blank()); setOpen(true); }} className="btn-primary">
          <Plus className="h-4 w-4" /> Dodaj
        </button>
      </div>

      {open && (
        <FormModal
          fields={fields}
          initial={editing ?? blank()}
          onClose={() => { setOpen(false); setEditing(null); }}
          onSubmit={submit}
          loading={create.isPending || update.isPending}
          error={create.error || update.error}
        />
      )}

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-ink-faint" /></div>
        ) : !data?.length ? (
          <div className="p-12 text-center text-sm text-ink-faint">Brak elementów.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b text-left text-xs text-ink-faint">
                <tr>
                  {columns.map((c) => <th key={c.key} className="px-4 py-3 font-medium">{c.label}</th>)}
                  <th className="px-4 py-3 text-right">Akcje</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row: any) => (
                  <tr key={row.id} className="border-b last:border-0 hover:bg-bg-soft/30">
                    {columns.map((c) => (
                      <td key={c.key} className="px-4 py-3">
                        {c.render ? c.render(row) : String(row[c.key] ?? "—")}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => { setEditing(row); setOpen(true); }} className="btn-ghost !px-2 !py-1.5"><Pencil className="h-3.5 w-3.5" /></button>
                        <button
                          onClick={() => { if (confirm("Usunąć?")) remove.mutate(row.id); }}
                          className="btn-ghost !px-2 !py-1.5 hover:text-bad"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function FormModal({
  fields,
  initial,
  onClose,
  onSubmit,
  loading,
  error,
}: {
  fields: Field[];
  initial: any;
  onClose: () => void;
  onSubmit: (form: any) => void;
  loading: boolean;
  error: unknown;
}) {
  const [form, setForm] = useState<any>(initial);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={onClose}>
      <div className="card w-full max-w-lg p-6 animate-fade-up" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">{initial?.id ? "Edytuj" : "Dodaj"}</h2>
          <button onClick={onClose} className="btn-ghost !px-2 !py-2"><X className="h-4 w-4" /></button>
        </div>
        <form
          onSubmit={(e) => { e.preventDefault(); onSubmit(form); }}
          className="max-h-[60vh] space-y-3 overflow-y-auto scrollbar-thin pr-1"
        >
          {fields.map((f) => (
            <div key={f.name}>
              <label className="label">{f.label}</label>
              {f.type === "textarea" ? (
                <textarea className="input min-h-20" value={form[f.name] ?? ""} onChange={(e) => setForm({ ...form, [f.name]: e.target.value })} placeholder={f.placeholder} />
              ) : f.type === "select" ? (
                <select className="input" value={form[f.name] ?? ""} onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}>
                  <option value="">—</option>
                  {f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              ) : f.type === "boolean" ? (
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-accent" checked={!!form[f.name]} onChange={(e) => setForm({ ...form, [f.name]: e.target.checked })} /> Tak</label>
              ) : f.type === "list" ? (
                <input
                  className="input"
                  value={Array.isArray(form[f.name]) ? (form[f.name] as string[]).join(", ") : ""}
                  onChange={(e) => setForm({ ...form, [f.name]: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
                  placeholder={f.placeholder ?? "wartość, wartość, …"}
                />
              ) : f.type === "number" ? (
                <input type="number" step={f.step ?? "1"} className="input" value={form[f.name] ?? 0} onChange={(e) => setForm({ ...form, [f.name]: +e.target.value })} placeholder={f.placeholder} />
              ) : (
                <input className="input" value={form[f.name] ?? ""} onChange={(e) => setForm({ ...form, [f.name]: e.target.value })} placeholder={f.placeholder} />
              )}
            </div>
          ))}
          {Boolean(error) && <p className="text-xs text-bad">{(error as Error).message}</p>}
        </form>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="btn-ghost">Anuluj</button>
          <button disabled={loading} onClick={() => onSubmit(form)} className="btn-primary">{loading ? "Zapisywanie…" : "Zapisz"}</button>
        </div>
      </div>
    </div>
  );
}
