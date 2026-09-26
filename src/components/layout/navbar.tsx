"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Menu, ShoppingCart, User, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useCart } from "@/components/cart-context";

interface SessionInfo {
  id: string;
  displayName: string | null;
  role: string;
  hasDiscord: boolean;
  hasMinecraft: boolean;
  minecraftNick: string | null;
  avatar: string | null;
}

async function fetchSession(): Promise<SessionInfo | null> {
  const res = await fetch("/api/session");
  if (!res.ok) return null;
  return res.json();
}

const NAV = [
  { href: "/", label: "Start" },
  { href: "/sklep", label: "Sklep" },
  { href: "/nagrody", label: "Nagrody" },
  { href: "/status", label: "Status" },
];

export function Navbar({ serverName, logo }: { serverName: string; logo?: string | null }) {
  const pathname = usePathname();
  const [mobile, setMobile] = useState(false);
  const cart = useCart();
  const { data: session } = useQuery({ queryKey: ["session"], queryFn: fetchSession });

  return (
    <nav className="relative z-10 flex items-center justify-between px-6 py-5 lg:px-12">
      <Link href="/" className="flex flex-col items-center">
        {logo ? (
          <img src={logo} alt="" className="h-7 w-7 object-cover" />
        ) : (
          <span className="display-text text-xl text-surface-300 glow-text">{serverName}</span>
        )}
      </Link>

      <div className="hidden items-center gap-6 md:flex">
        {NAV.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className={cn(
              "text-sm font-medium tracking-wide transition",
              pathname === n.href ? "text-ink" : "text-surface-500 hover:text-surface-300",
            )}
          >
            {n.label}
          </Link>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => cart.setOpen(true)}
          className="relative flex h-8 w-8 items-center justify-center text-surface-500 hover:text-surface-300 transition"
          aria-label="Koszyk"
        >
          <ShoppingCart className="h-4 w-4" />
          {cart.count > 0 && (
            <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center px-1 text-[10px] font-bold text-accent-fg" style={{ background: "rgb(var(--accent))" }}>
              {cart.count}
            </span>
          )}
        </button>

        {session ? (
          <Link href="/konto" className="flex h-8 w-8 items-center justify-center text-surface-500 hover:text-surface-300 transition" aria-label="Konto">
            {session.avatar ? (
              <img src={session.avatar} alt="" className="h-6 w-6 rounded-full" />
            ) : (
              <User className="h-4 w-4" />
            )}
          </Link>
        ) : (
          <Link href="/login" className="hidden text-sm font-medium text-surface-500 hover:text-surface-300 transition sm:block">
            Zaloguj
          </Link>
        )}

        {session && (session.role === "ADMIN" || session.role === "OWNER") && (
          <Link href="/admin" className="hidden text-sm font-medium text-surface-500 hover:text-surface-300 transition sm:block">
            Panel
          </Link>
        )}

        <button className="text-surface-500 hover:text-surface-300 transition md:hidden" onClick={() => setMobile((v) => !v)} aria-label="Menu">
          {mobile ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobile && (
        <div className="absolute left-0 right-0 top-full border-t border-surface-800/40 bg-surface-950 px-6 py-4 md:hidden">
          <div className="flex flex-col gap-1">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setMobile(false)}
                className="py-2 text-sm text-surface-400 hover:text-surface-300 transition"
              >
                {n.label}
              </Link>
            ))}
            {!session && (
              <Link href="/login" onClick={() => setMobile(false)} className="btn-primary mt-2">
                Zaloguj
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
