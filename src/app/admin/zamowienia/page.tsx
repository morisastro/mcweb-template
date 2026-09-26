"use client";

import { useQuery } from "@tanstack/react-query";
import { formatPLN, timeAgo } from "@/lib/utils";
import { cn } from "@/lib/utils";

export default function ZamowieniaPage() {
  const { data, isLoading } = useQuery({ queryKey: ["admin", "orders"], queryFn: async () => (await fetch("/api/admin/orders")).json() });

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-bold">Zamówienia</h1>
      <div className="card overflow-hidden">
        {isLoading ? <div className="p-12 text-center text-ink-faint">Ładowanie…</div> : !data?.length ? <div className="p-12 text-center text-sm text-ink-faint">Brak zamówień.</div> : (
          <table className="w-full text-sm">
            <thead className="border-b text-left text-xs text-ink-faint">
              <tr><th className="px-4 py-3">ID</th><th className="px-4 py-3">Gracz</th><th className="px-4 py-3">Data</th><th className="px-4 py-3">Płatność</th><th className="px-4 py-3">Dostawa</th><th className="px-4 py-3 text-right">Kwota</th></tr>
            </thead>
            <tbody>
              {data.map((o: any) => (
                <tr key={o.id} className="border-b last:border-0 hover:bg-bg-soft/30">
                  <td className="px-4 py-3 font-mono text-xs">{o.publicId}</td>
                  <td className="px-4 py-3">{o.playerNick}</td>
                  <td className="px-4 py-3 text-ink-faint">{timeAgo(o.createdAt)}</td>
                  <td className="px-4 py-3"><span className={cn("chip !py-0.5", o.paymentStatus === "PAID" ? "border-ok/30 text-ok" : o.paymentStatus === "FAILED" ? "border-bad/30 text-bad" : "")}>{o.paymentStatus}</span></td>
                  <td className="px-4 py-3"><span className={cn("chip !py-0.5", o.deliveryStatus === "DELIVERED" ? "border-ok/30 text-ok" : o.deliveryStatus === "FAILED" ? "border-bad/30 text-bad" : "")}>{o.deliveryStatus}</span></td>
                  <td className="px-4 py-3 text-right font-medium">{formatPLN(o.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
