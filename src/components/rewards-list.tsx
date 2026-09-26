"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { Check, Gift, Lock, Loader2 } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface Reward {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  type: string;
  icon: string | null;
  progress: { current: number; required: number; complete: boolean; reason?: string };
  claimed: boolean;
  claimLimit: number;
}

async function fetchRewards(): Promise<Reward[]> {
  const res = await fetch("/api/rewards");
  return res.json();
}

export function RewardsList() {
  const { data, isLoading, refetch } = useQuery({ queryKey: ["rewards"], queryFn: fetchRewards });
  const [code, setCode] = useState("");
  const [codeMsg, setCodeMsg] = useState<string | null>(null);

  const claim = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch("/api/rewards/claim", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rewardId: id }) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      return d;
    },
    onSuccess: () => refetch(),
  });

  const redeem = useMutation({
    mutationFn: async (c: string) => {
      const res = await fetch("/api/rewards/redeem", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: c }) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      return d;
    },
    onSuccess: () => { setCode(""); setCodeMsg("Kod zrealizowany!"); refetch(); },
    onError: (e) => setCodeMsg((e as Error).message),
  });

  if (isLoading) return <div className="grid place-items-center py-16"><Loader2 className="h-6 w-6 animate-spin text-ink-faint" /></div>;

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data?.map((r, i) => (
          <div key={r.id} className="card card-hover animate-fade-up p-6 [animation-delay:${i * 50}ms]">
            <div className="mb-4 flex items-center justify-between">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-accent/10 text-2xl text-accent">{r.icon ?? <Gift className="h-5 w-5" />}</div>
              {r.claimed ? (
                <span className="chip border-ok/30 text-ok"><Check className="h-3 w-3" /> Odebrane</span>
              ) : r.progress.complete ? (
                <span className="chip border-accent/30 text-accent">Gotowe</span>
              ) : (
                <span className="chip"><Lock className="h-3 w-3" /> Wymagania</span>
              )}
            </div>
            <div className="font-display text-lg font-semibold">{r.name}</div>
            {r.description && <p className="mt-1 text-sm text-ink-soft">{r.description}</p>}

            <div className="mt-4">
              {!r.progress.complete && r.progress.reason && (
                <div className="text-xs text-ink-faint">{r.progress.reason}</div>
              )}
              {r.progress.required > 1 && (
                <div className="mt-2">
                  <div className="h-1.5 overflow-hidden rounded-full bg-bg-soft">
                    <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${Math.min(100, (r.progress.current / r.progress.required) * 100)}%` }} />
                  </div>
                  <div className="mt-1 text-xs text-ink-faint">{Math.floor(r.progress.current)}/{r.progress.required}</div>
                </div>
              )}
            </div>

            <button
              disabled={!r.progress.complete || r.claimed || claim.isPending}
              onClick={() => claim.mutate(r.id)}
              className={cn("mt-4 w-full", r.claimed ? "btn-dark" : r.progress.complete ? "btn-primary" : "btn-ghost opacity-60")}
            >
              {r.claimed ? "Odebrane" : r.progress.complete ? "Odbierz" : "Niedostępne"}
            </button>
            {claim.error && claim.variables === r.id && <p className="mt-2 text-xs text-bad">{(claim.error as Error).message}</p>}
          </div>
        ))}
      </div>

      <div className="mt-8 card p-6">
        <div className="mb-2 font-display font-semibold">Kod promocyjny</div>
        <div className="flex gap-2">
          <input className="input" placeholder="Wpisz kod" value={code} onChange={(e) => setCode(e.target.value)} />
          <button disabled={redeem.isPending || !code} onClick={() => redeem.mutate(code)} className="btn-primary">
            Realizuj
          </button>
        </div>
        {codeMsg && <p className="mt-2 text-xs text-ink-soft">{codeMsg}</p>}
      </div>
    </div>
  );
}
