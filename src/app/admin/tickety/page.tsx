"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { cn, timeAgo } from "@/lib/utils";

export default function AdminTicketyPage() {
  const qc = useQueryClient();
  const [active, setActive] = useState<string | null>(null);

  const { data } = useQuery({ queryKey: ["admin", "tickets"], queryFn: async () => (await fetch("/api/admin/tickets")).json() });
  const ticket = useQuery({
    queryKey: ["admin", "ticket", active],
    queryFn: async () => (active ? (await fetch(`/api/admin/tickets/${active}`)).json() : null),
    enabled: !!active,
  });
  const [reply, setReply] = useState("");

  const send = useMutation({
    mutationFn: async () => {
      await fetch(`/api/admin/tickets/${active}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body: reply }) });
    },
    onSuccess: () => { setReply(""); qc.invalidateQueries({ queryKey: ["admin", "ticket", active] }); },
  });

  const setStatus = useMutation({
    mutationFn: async (status: string) => {
      await fetch("/api/admin/tickets", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ publicId: active, status }) });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "tickets"] }),
  });

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      <div className="w-80 shrink-0 space-y-2 overflow-y-auto scrollbar-thin">
        <h1 className="mb-2 font-display text-2xl font-bold">Tickety</h1>
        {data?.map((t: any) => (
          <button key={t.id} onClick={() => setActive(t.publicId)} className={cn("card w-full p-4 text-left transition", active === t.publicId ? "border-accent" : "hover:border-ink-faint/40")}>
            <div className="truncate font-medium">{t.subject}</div>
            <div className="mt-1 flex items-center justify-between text-xs text-ink-faint">
              <span>{t.user?.displayName ?? "—"}</span>
              <span>{t.status.replace(/_/g, " ")}</span>
            </div>
          </button>
        ))}
      </div>

      <div className="flex-1">
        {ticket.data ? (
          <div className="card flex h-full flex-col">
            <div className="flex items-center justify-between border-b p-4">
              <div>
                <div className="font-display font-semibold">{ticket.data.subject}</div>
                <div className="text-xs text-ink-faint">{ticket.data.publicId} · {ticket.data.category}</div>
              </div>
              <select className="input !w-auto !py-1.5 text-xs" defaultValue={ticket.data.status} onChange={(e) => setStatus.mutate(e.target.value)}>
                <option value="OPEN">Open</option>
                <option value="WAITING_FOR_USER">Waiting for user</option>
                <option value="WAITING_FOR_STAFF">Waiting for staff</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto scrollbar-thin p-4">
              {ticket.data.messages.map((m: any) => (
                <div key={m.id} className={cn("max-w-[75%] rounded-lg px-3.5 py-2.5", m.authorRole === "staff" ? "ml-auto bg-accent/15 border border-accent/30" : "bg-bg-soft border")}>
                  <div className="mb-0.5 text-[10px] uppercase tracking-wider text-ink-faint">{m.authorRole ?? "system"} · {timeAgo(m.createdAt)}</div>
                  <div className="whitespace-pre-wrap text-sm">{m.body}</div>
                </div>
              ))}
            </div>
            <div className="border-t p-3">
              <div className="flex gap-2">
                <input className="input" placeholder="Odpowiedź…" value={reply} onChange={(e) => setReply(e.target.value)} />
                <button disabled={!reply.trim() || send.isPending} onClick={() => send.mutate()} className="btn-primary">Wyślij</button>
              </div>
            </div>
          </div>
        ) : (
          <div className="card grid h-full place-items-center text-ink-faint">Wybierz ticket z listy</div>
        )}
      </div>
    </div>
  );
}
