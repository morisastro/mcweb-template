"use client";

import { useState } from "react";
import { useCart } from "@/components/cart-context";
import { cn, formatPLN } from "@/lib/utils";
import { Product, Category } from "@prisma/client";
import { Plus } from "lucide-react";

export function ProductGrid({ products, categories }: { products: (Product & { category: Category | null })[]; categories: Category[] }) {
  const cart = useCart();
  const [activeCat, setActiveCat] = useState<string>("all");

  const filtered = activeCat === "all" ? products : products.filter((p) => p.categoryId === activeCat);

  if (products.length === 0) {
    return <div className="card p-12 text-center text-ink-faint">Brak produktów w tym trybie.</div>;
  }

  return (
    <div>
      {categories.length > 1 && (
        <div className="mb-6 flex flex-wrap gap-2">
          <CatChip active={activeCat === "all"} onClick={() => setActiveCat("all")}>Wszystkie</CatChip>
          {categories.map((c) => (
            <CatChip key={c.id} active={activeCat === c.id} onClick={() => setActiveCat(c.id)}>
              {c.name}
            </CatChip>
          ))}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((p, i) => (
          <div key={p.id} className="card card-hover group flex flex-col animate-fade-up p-5 [animation-delay:${i * 40}ms]">
            <div className="mb-4 flex items-start justify-between">
              <div className="grid h-12 w-12 place-items-center rounded-lg bg-bg-soft text-2xl">{p.icon ?? "📦"}</div>
              {p.oldPrice && (
                <span className="chip border-bad/30 text-bad">-{Math.round((1 - p.price.toNumber() / p.oldPrice.toNumber()) * 100)}%</span>
              )}
            </div>
            <div className="font-display text-lg font-semibold">{p.name}</div>
            {p.description && <p className="mt-1 line-clamp-2 text-sm text-ink-soft">{p.description}</p>}
            {p.duration && <div className="mt-2 chip !py-0.5 text-[10px]">Czas trwania: {p.duration}</div>}
            <div className="mt-auto flex items-center justify-between pt-4">
              <div>
                {p.oldPrice && <div className="text-xs text-ink-faint line-through">{formatPLN(p.oldPrice)}</div>}
                <div className="font-display text-xl font-bold">{formatPLN(p.price)}</div>
              </div>
              <button
                onClick={() =>
                  cart.add({ productId: p.id, name: p.name, price: p.price.toNumber(), icon: p.icon, modeId: p.modeId })
                }
                className="btn-primary !px-3"
              >
                <Plus className="h-4 w-4" /> Dodaj
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CatChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full border px-3.5 py-1.5 text-sm transition",
        active ? "border-accent bg-accent/15 text-accent" : "text-ink-soft hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}
