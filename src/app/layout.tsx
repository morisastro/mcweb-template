import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { AccentBootstrap } from "@/components/accent-bootstrap";
import { getPublicSettings } from "@/server/settings";
import { Bebas_Neue, Inter, Roboto_Condensed } from "next/font/google";

const bebas = Bebas_Neue({ weight: "400", subsets: ["latin"], variable: "--font-display", display: "swap", preload: false });
const inter = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const roboto = Roboto_Condensed({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

// All pages use the database / cookies / sessions, so they must render at
// request time. Opts out of static prerendering entirely.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Serwer Minecraft",
  description: "Nowoczesny serwer Minecraft",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getPublicSettings();
  const name = settings["server.name"] ?? "MythCraft";
  const accent = settings["server.accentColor"] ?? "138 99 255";

  return (
    <html lang="pl" suppressHydrationWarning className={`${bebas.variable} ${inter.variable} ${roboto.variable}`}>
      <body
        style={{
          ["--accent" as any]: accent,
          ["--accent-soft" as any]: accent,
        }}
      >
        <AccentBootstrap accent={accent} />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
