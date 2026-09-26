"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import * as Icons from "lucide-react";
import { Menu, X, LogOut, Home } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface SessionUser {
  id: string;
  displayName: string | null;
  role: string;
  avatar: string | null;
}

export function AdminShell({
  nav,
  user,
  children,
}: {
  nav: { href: string; label: string; icon: string }[];
  user: SessionUser;
  children: React.ReactNode;
}) {
  const path = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform border-r bg-bg-soft/80 backdrop-blur-xl transition-transform lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between border-b px-4">
          <Link href="/admin" className="font-display text-lg font-semibold">
            Panel<span className="text-accent">.</span>
          </Link>
          <button onClick={() => setOpen(false)} className="btn-ghost !px-2 lg:hidden">
            <X className="h-4 w-4" />
          </button>
        </div>
        <nav className="flex flex-col gap-0.5 p-3">
          {nav.map((n) => {
            const Icon = ((Icons as unknown) as Record<string, LucideIcon>)[n.icon] ?? Icons.Circle;
            const active = n.href === "/admin" ? path === "/admin" : path.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                  active ? "bg-accent/15 text-accent" : "text-ink-soft hover:bg-bg-card hover:text-ink",
                )}
              >
                <Icon className="h-4 w-4" />
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto border-t p-3">
          <div className="mb-2 flex items-center gap-2 px-2 text-xs text-ink-faint">
            {user.avatar && <img src={user.avatar} alt="" className="h-6 w-6 rounded-full" />}
            <span className="truncate">{user.displayName ?? "Admin"}</span>
            <span className="chip !py-0 !text-[10px]">{user.role}</span>
          </div>
          <div className="flex gap-2">
            <Link href="/" className="btn-ghost flex-1 !px-2 !py-2 !text-xs"><Home className="h-3.5 w-3.5" /> Strona</Link>
            <button onClick={() => fetch("/api/auth/logout", { method: "POST" }).then(() => (window.location.href = "/"))} className="btn-ghost !px-2 !py-2 !text-xs">
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {open && <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setOpen(false)} />}

      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b px-4 lg:hidden">
          <button onClick={() => setOpen(true)} className="btn-ghost !px-2"><Menu className="h-4 w-4" /></button>
          <span className="font-display font-semibold">Panel admina</span>
          <span />
        </header>
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
