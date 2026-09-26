"use client";

import { useCart } from "@/components/cart-context";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { formatPLN } from "@/lib/utils";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface SessionInfo {
  minecraftNick: string | null;
}

async function checkout(payload: unknown): Promise<{ redirectUrl: string; orderId: string }> {
  const res = await fetch("/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Błąd zamówienia");
  return data;
}

export function CartDrawer() {
  const cart = useCart();
  const router = useRouter();
  const [nick, setNick] = useState("");
  const [forOther, setForOther] = useState(false);
  const [coupon, setCoupon] = useState("");

  const { data: session } = useQuery<SessionInfo>({
    queryKey: ["session"],
    queryFn: async () => (await fetch("/api/session")).json(),
  });

  const effectiveNick = forOther ? nick : session?.minecraftNick ?? nick;

  const mut = useMutation({
    mutationFn: checkout,
    onSuccess: (data) => {
      cart.clear();
      cart.setOpen(false);
      router.push(`/zamowienie/${data.orderId}`);
    },
  });

  return (
    <>
      <div
        className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity ${
          cart.open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => cart.setOpen(false)}
      />
      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l bg-bg-card shadow-2xl transition-transform duration-300 ${
          cart.open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div className="flex items-center gap-2 font-display font-semibold">
            <ShoppingBag className="h-4 w-4 text-accent" />
            Koszyk
          </div>
          <button onClick={() => cart.setOpen(false)} className="btn-ghost !px-2 !py-2">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin px-5 py-4">
          {cart.lines.length === 0 ? (
            <div className="grid h-full place-items-center text-center text-ink-faint">
              <div>
                <ShoppingBag className="mx-auto mb-3 h-8 w-8 opacity-50" />
                Koszyk jest pusty
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.lines.map((l) => (
                <div key={l.productId} className="flex items-center gap-3 rounded-lg border bg-bg-soft/40 p-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-bg-card text-lg">
                    {l.icon ?? "📦"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{l.name}</div>
                    <div className="text-xs text-ink-faint">{formatPLN(l.price)}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => cart.setQty(l.productId, l.quantity - 1)}
                      className="grid h-6 w-6 place-items-center rounded border text-ink-soft hover:text-ink"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-6 text-center text-sm">{l.quantity}</span>
                    <button
                      onClick={() => cart.setQty(l.productId, l.quantity + 1)}
                      className="grid h-6 w-6 place-items-center rounded border text-ink-soft hover:text-ink"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                  <button onClick={() => cart.remove(l.productId)} className="text-ink-faint hover:text-bad">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {cart.lines.length > 0 && (
          <div className="space-y-3 border-t px-5 py-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink-soft">Razem</span>
              <span className="font-display text-lg font-semibold">{formatPLN(cart.total)}</span>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs text-ink-soft">
                <input
                  type="checkbox"
                  checked={forOther}
                  onChange={(e) => setForOther(e.target.checked)}
                  className="accent-accent"
                />
                Kup dla innego gracza
              </label>
              <input
                className="input"
                placeholder={forOther ? "Nick gracza (Minecraft)" : session?.minecraftNick ?? "Nick gracza (Minecraft)"}
                value={nick}
                onChange={(e) => setNick(e.target.value)}
              />
              <input
                className="input"
                placeholder="Kod rabatowy (opcjonalnie)"
                value={coupon}
                onChange={(e) => setCoupon(e.target.value)}
              />
            </div>

            {mut.error && (
              <div className="text-xs text-bad">{(mut.error as Error).message}</div>
            )}

            <button
              disabled={mut.isPending || !effectiveNick}
              onClick={() =>
                mut.mutate({
                  playerNick: effectiveNick,
                  forOther,
                  couponCode: coupon || undefined,
                  lines: cart.lines.map((l) => ({ productId: l.productId, quantity: l.quantity })),
                })
              }
              className="btn-primary w-full"
            >
              {mut.isPending ? "Przetwarzanie…" : "Przejdź do płatności"}
            </button>
            {!effectiveNick && (
              <p className="text-center text-xs text-ink-faint">
                Podaj nick lub <a className="text-accent" href="/login">zaloguj się</a> przez Minecraft.
              </p>
            )}
          </div>
        )}
      </aside>
    </>
  );
}
