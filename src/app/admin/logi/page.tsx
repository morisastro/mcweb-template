"use client";

import { useQuery } from "@tanstack/react-query";
import { timeAgo } from "@/lib/utils";

export default function LogiPage() {
  const { data, isLoading } = useQuery({ queryKey: ["admin", "logs"], queryFn: async () => (await fetch("/api/admin/logs")).json() });

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-bold">Logi (Audit)</h1>
      <div className="card overflow-hidden">
        {isLoading ? <div className="p-12 text-center text-ink-faint">Ładowanie…</div> : !data?.length ? <div className="p-12 text-center text-sm text-ink-faint">Brak logów.</div> : (
          <table className="w-full text-sm">
            <thead className="border-b text-left text-xs text-ink-faint">
              <tr><th className="px-4 py-3">Akcja</th><th className="px-4 py-3">Wykonawca</th><th className="px-4 py-3">Cel</th><th className="px-4 py-3">Czas</th></tr>
            </thead>
            <tbody>
              {data.map((l: any) => (
                <tr key={l.id} className="border-b last:border-0 hover:bg-bg-soft/30">
                  <td className="px-4 py-3 font-mono text-xs text-accent">{l.action}</td>
                  <td className="px-4 py-3">{l.actor?.displayName ?? "system"}</td>
                  <td className="px-4 py-3 text-ink-faint">{l.target ?? "—"}</td>
                  <td className="px-4 py-3 text-ink-faint">{timeAgo(l.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
