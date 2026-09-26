import { SiteShell } from "@/components/site-shell";
import { getPublicSettings } from "@/server/settings";
import { config } from "@/config/server";
import { RewardsList } from "@/components/rewards-list";
import { MediaForm } from "@/components/media-form";

export default async function NagrodyPage() {
  const settings = await getPublicSettings();
  const name = settings["server.name"] ?? config.serverName;

  return (
    <SiteShell serverName={name} logo={settings["server.logo"] ?? null} discordUrl={settings["server.discordUrl"] ?? config.discordUrl}>
      <div className="container-page py-12">
        <div className="mb-10">
          <h1 className="font-display text-4xl font-bold">Nagrody</h1>
          <p className="mt-2 text-ink-soft">Odbieraj nagrody za aktywność, łączenie kont i eventy.</p>
        </div>

        <RewardsList />

        <div className="mt-16">
          <h2 className="section-title mb-2">Nagroda Media</h2>
          <p className="mb-6 text-ink-soft">Tworzysz treści o serwerze? Zgłoś się o nagrodę dla twórców. Zgłoszenia weryfikuje administracja.</p>
          <MediaForm />
        </div>
      </div>
    </SiteShell>
  );
}
