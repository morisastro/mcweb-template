"use client";

import { CartProvider } from "@/components/cart-context";
import { CartDrawer } from "@/components/cart-drawer";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

export function SiteShell({
  children,
  serverName,
  logo,
  discordUrl,
}: {
  children: React.ReactNode;
  serverName: string;
  logo?: string | null;
  discordUrl?: string | null;
}) {
  return (
    <CartProvider>
      <div className="relative flex min-h-screen flex-col overflow-hidden">
        <Navbar serverName={serverName} logo={logo} />
        <div className="container-page relative z-10">
          <div className="h-px" style={{ background: "linear-gradient(to right, transparent, rgb(var(--surface-700) / 0.3), transparent)" }} />
        </div>
        <main className="relative z-10 flex-1">{children}</main>
        <Footer serverName={serverName} discordUrl={discordUrl} />
        <CartDrawer />
      </div>
    </CartProvider>
  );
}
