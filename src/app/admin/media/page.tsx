"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { timeAgo } from "@/lib/utils";
import { cn } from "@/lib/utils";

export default function AdminMediaPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin", "media"], queryFn: async () => (await fetch("/api/admin/media")).json() });

  const review = useMutation({
    mutationFn: async (payload: { id: string; action: string; note?: string; expiresAt?: string }) => {
      await fetch("/api/admin/media", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "media"] }),
  });

  if (isLoading) return <div className="text-ink-faint">Ładowanie…</div>;

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-bold">Zgłoszenia Media</h1>
      {!data?.length ? <div className="card p-12 text-center text-ink-faint">Brak zgłoszeń.</div> : (
        <div className="space-y-4">
          {data.map((m: any) => (
            <div key={m.id} className="card p-5">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <span className="chip !py-0.5">{m.platform}</span>
                  <span className="ml-2 font-medium">{m.user?.displayName ?? "—"}</span>
                </div>
                <span className={cn("chip !py-0.5", m.status === "APPROVED" ? "border-ok/30 text-ok" : m.status === "REJECTED" ? "border-bad/30 text-bad" : m.status === "PENDING" ? "border-warn/30 text-warn" : "")}>{m.status}</span>
              </div>
              <div className="grid gap-2 text-sm sm:grid-cols-2">
                <div><span className="text-ink-faint">Profil:</span> <a href={m.profileUrl} target="_blank" rel="noreferrer" className="text-accent underline">{m.profileUrl}</a></div>
                <div><span className="text-ink-faint">Materiał:</span> <a href={m.contentUrl} target="_blank" rel="noreferrer" className="text-accent underline">link</a></div>
                <div><span className="text-ink-faint">Obserwujący:</span> {m.followers}</div>
                <div><span className="text-ink-faint">Śr. wyświetlenia:</span> {m.avgViews}</div>
              </div>
              {m.message && <p className="mt-2 text-sm text-ink-soft">{m.message}</p>}
              {m.reviewNote && <p className="mt-1 text-xs text-ink-faint">Notatka: {m.reviewNote}</p>}
              <div className="mt-3 flex flex-wrap gap-2">
                {m.status !== "APPROVED" && <button onClick={() => review.mutate({ id: m.id, action: "approve" })} className="btn-primary !py-1.5 !text-xs">Akceptuj</button>}
                {m.status !== "REJECTED" && <button onClick={() => review.mutate({ id: m.id, action: "reject" })} className="btn-ghost !py-1.5 !text-xs hover:text-bad">Odrzuć</button>}
                <button onClick={() => { const note = prompt("Dodatkowe informacje dla twórcy:"); if (note) review.mutate({ id: m.id, action: "needs_info", note }); }} className="btn-ghost !py-1.5 !text-xs">Poproś o info</button>
                <button onClick={() => { const d = prompt("Data wygaśnięcia (ISO):"); if (d) review.mutate({ id: m.id, action: "expire", expiresAt: d }); }} className="btn-ghost !py-1.5 !text-xs">Ustaw wygaśnięcie</button>
                <span className="ml-auto self-center text-xs text-ink-faint">{timeAgo(m.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
