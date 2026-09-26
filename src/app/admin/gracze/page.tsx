"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { timeAgo } from "@/lib/utils";

export default function GraczePage() {
  const [q, setQ] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "players", q],
    queryFn: async () => (await fetch(`/api/admin/players?q=${encodeURIComponent(q)}`)).json(),
  });

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-bold">Gracze</h1>
      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
        <input className="input pl-9" placeholder="Szukaj nicku…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-ink-faint">Ładowanie…</div>
        ) : !data?.length ? (
          <div className="p-12 text-center text-sm text-ink-faint">Brak graczy.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b text-left text-xs text-ink-faint">
              <tr>
                <th className="px-4 py-3">Gracz</th>
                <th className="px-4 py-3">Minecraft</th>
                <th className="px-4 py-3">Discord</th>
                <th className="px-4 py-3">Rola</th>
                <th className="px-4 py-3">Dołączył</th>
              </tr>
            </thead>
            <tbody>
              {data.map((u: any) => (
                <tr key={u.id} className="border-b last:border-0 hover:bg-bg-soft/30">
                  <td className="px-4 py-3">
                    <Link href={`/admin/gracze/${u.id}`} className="font-medium hover:text-accent">
                      {u.displayName ?? "—"}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{u.minecraft?.username ?? "—"}</td>
                  <td className="px-4 py-3">{u.discord?.username ?? "—"}</td>
                  <td className="px-4 py-3"><span className="chip !py-0.5">{u.role}</span></td>
                  <td className="px-4 py-3 text-ink-faint">{timeAgo(u.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
