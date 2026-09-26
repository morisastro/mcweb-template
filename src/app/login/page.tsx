import { SiteShell } from "@/components/site-shell";
import { getPublicSettings } from "@/server/settings";
import { config } from "@/config/server";
import { isDiscordConfigured } from "@/server/discord";
import { MinecraftLoginForm } from "@/components/minecraft-login-form";
import { AdminLoginForm } from "@/components/admin-login-form";

export default async function LoginPage() {
  const settings = await getPublicSettings();
  const name = settings["server.name"] ?? config.serverName;
  const discord = isDiscordConfigured();

  return (
    <SiteShell serverName={name} logo={settings["server.logo"] ?? null} discordUrl={settings["server.discordUrl"] ?? config.discordUrl}>
      <div className="container-page grid place-items-center py-16">
        <div className="w-full max-w-md animate-fade-up">
          <div className="mb-8 text-center">
            <h1 className="font-display text-3xl font-bold">Zaloguj się</h1>
            <p className="mt-2 text-sm text-ink-soft">Wybierz sposób logowania. Konta można połączyć później.</p>
          </div>

          <div className="card space-y-3 p-6">
            {discord ? (
              <a href="/api/auth/discord" className="btn-dark w-full">
                <DiscordIcon /> Kontynuuj z Discord
              </a>
            ) : (
              <div className="rounded-lg border border-dashed p-3 text-center text-xs text-ink-faint">
                Logowanie Discord wymaga uzupełienia DISCORD_CLIENT_ID / SECRET w .env
              </div>
            )}

            <div className="flex items-center gap-3 py-1 text-xs text-ink-faint">
              <span className="h-px flex-1 bg-line" /> lub <span className="h-px flex-1 bg-line" />
            </div>

            <MinecraftLoginForm />

            <details className="group pt-2">
              <summary className="cursor-pointer text-xs text-ink-faint transition hover:text-ink-soft">
                Logowanie administratora
              </summary>
              <div className="mt-3 animate-fade-in">
                <AdminLoginForm />
              </div>
            </details>
          </div>

          <p className="mt-4 text-center text-xs text-ink-faint">
            Logując się akceptujesz regulamin serwera. Nie przechowujemy haseł Minecraft.
          </p>
        </div>
      </div>
    </SiteShell>
  );
}

function DiscordIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
      <path d="M20.3 4.4A19 19 0 0 0 15.6 3l-.3.5a14 14 0 0 1 4.1 1.3 13.6 13.6 0 0 0-11 0A14 14 0 0 1 12.5 3.5L12.2 3a19 19 0 0 0-4.7 1.4A20 20 0 0 0 2.5 18a19 19 0 0 0 5.8 2.9l.7-1.2a12 12 0 0 1-1.9-.9l.5-.3a13.5 13.5 0 0 0 11.6 0l.5.3a12 12 0 0 1-1.9.9l.7 1.2A19 19 0 0 0 24 18a20 20 0 0 0-3.7-13.6zM9 15.3c-1.1 0-2-1-2-2.3s.9-2.3 2-2.3 2 1 2 2.3-.9 2.3-2 2.3zm6 0c-1.1 0-2-1-2-2.3s.9-2.3 2-2.3 2 1 2 2.3-.9 2.3-2 2.3z" />
    </svg>
  );
}
