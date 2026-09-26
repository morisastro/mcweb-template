"use client";

import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";

export interface CartLine {
  productId: string;
  name: string;
  price: number;
  icon?: string | null;
  modeId: string;
  quantity: number;
}

interface CartCtx {
  lines: CartLine[];
  add: (line: Omit<CartLine, "quantity">, qty?: number) => void;
  remove: (productId: string) => void;
  setQty: (productId: string, qty: number) => void;
  clear: () => void;
  count: number;
  total: number;
  open: boolean;
  setOpen: (v: boolean) => void;
}

const Ctx = createContext<CartCtx | null>(null);
const KEY = "mcweb_cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [open, setOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setLines(JSON.parse(raw));
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(KEY, JSON.stringify(lines));
  }, [lines, hydrated]);

  const add = useCallback((line: Omit<CartLine, "quantity">, qty = 1) => {
    setLines((prev) => {
      const found = prev.find((l) => l.productId === line.productId);
      if (found) return prev.map((l) => (l.productId === line.productId ? { ...l, quantity: l.quantity + qty } : l));
      return [...prev, { ...line, quantity: qty }];
    });
    setOpen(true);
  }, []);

  const remove = useCallback((id: string) => setLines((p) => p.filter((l) => l.productId !== id)), []);
  const setQty = useCallback(
    (id: string, q: number) =>
      setLines((p) => p.map((l) => (l.productId === id ? { ...l, quantity: Math.max(1, q) } : l))),
    [],
  );
  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<CartCtx>(
    () => ({
      lines,
      add,
      remove,
      setQty,
      clear,
      count: lines.reduce((s, l) => s + l.quantity, 0),
      total: lines.reduce((s, l) => s + l.price * l.quantity, 0),
      open,
      setOpen,
    }),
    [lines, add, remove, setQty, clear, open],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart must be used within CartProvider");
  return c;
}
