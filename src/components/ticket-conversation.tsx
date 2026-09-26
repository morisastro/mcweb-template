"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/utils";

interface Message {
  id: string;
  authorId: string | null;
  authorRole: string | null;
  body: string;
  attachments: string[];
  createdAt: string;
}

export function TicketConversation({
  publicId,
  subject,
  status,
  messages: initial,
  currentUserId,
}: {
  publicId: string;
  subject: string;
  status: string;
  messages: Message[];
  currentUserId: string;
}) {
  const qc = useQueryClient();
  const [body, setBody] = useState("");

  const { data } = useQuery({
    queryKey: ["ticket", publicId],
    queryFn: async () => (await fetch(`/api/tickets/${publicId}`)).json(),
    initialData: { messages: initial, subject, status },
    refetchInterval: 8000,
  });

  const msgs: Message[] = data?.messages ?? initial;

  const send = useMutation({
    mutationFn: async (b: string) => {
      const res = await fetch(`/api/tickets/${publicId}/messages`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body: b }) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      return d;
    },
    onSuccess: () => { setBody(""); qc.invalidateQueries({ queryKey: ["ticket", publicId] }); },
  });

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">{data?.subject ?? subject}</h1>
          <div className="text-xs text-ink-faint">{publicId} · <span className="capitalize">{data?.status ?? status}</span></div>
        </div>
      </div>

      <div className="card flex h-[55vh] flex-col">
        <div className="flex-1 space-y-3 overflow-y-auto scrollbar-thin p-5">
          {msgs.map((m) => {
            const mine = m.authorId === currentUserId;
            const system = m.authorRole === "system";
            if (system) return <div key={m.id} className="text-center text-xs text-ink-faint">{m.body}</div>;
            return (
              <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                <div className={cn("max-w-[75%] rounded-lg px-3.5 py-2.5", mine ? "bg-accent/15 border border-accent/30" : "bg-bg-soft border")}>
                  <div className="mb-0.5 text-[10px] uppercase tracking-wider text-ink-faint">{m.authorRole === "staff" ? "Support" : "Ty"} · {timeAgo(m.createdAt)}</div>
                  <div className="whitespace-pre-wrap text-sm">{m.body}</div>
                  {m.attachments.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {m.attachments.map((a, i) => <a key={i} href={a} target="_blank" rel="noreferrer" className="text-xs text-accent underline">załącznik {i + 1}</a>)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {(data?.status ?? status) !== "CLOSED" ? (
          <form onSubmit={(e) => { e.preventDefault(); if (body.trim()) send.mutate(body); }} className="border-t p-3">
            <div className="flex gap-2">
              <input className="input" placeholder="Napisz wiadomość…" value={body} onChange={(e) => setBody(e.target.value)} />
              <button disabled={send.isPending || !body.trim()} className="btn-primary">Wyślij</button>
            </div>
          </form>
        ) : (
          <div className="border-t p-4 text-center text-sm text-ink-faint">Ticket zamknięty.</div>
        )}
      </div>
    </div>
  );
}
