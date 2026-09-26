import Link from "next/link";

export function Footer({ serverName, discordUrl }: { serverName: string; discordUrl?: string | null }) {
  return (
    <footer className="relative z-10 border-t border-surface-800/30 px-6 py-8 lg:px-12">
      <div className="mx-auto max-w-3xl">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="display-text text-lg text-surface-400 glow-text">{serverName}</div>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-surface-600">
            <Link href="/" className="hover:text-surface-400 transition">Start</Link>
            <Link href="/sklep" className="hover:text-surface-400 transition">Sklep</Link>
            <Link href="/nagrody" className="hover:text-surface-400 transition">Nagrody</Link>
            <Link href="/status" className="hover:text-surface-400 transition">Status</Link>
            <Link href="/konto" className="hover:text-surface-400 transition">Konto</Link>
            {discordUrl && (
              <a href={discordUrl} target="_blank" rel="noreferrer" className="hover:text-surface-400 transition">Discord</a>
            )}
          </div>
          <div className="text-[10px] text-surface-700">
            © {new Date().getFullYear()} {serverName}. Wszelkie prawa zastrzeżone.
          </div>
        </div>
      </div>
    </footer>
  );
}
