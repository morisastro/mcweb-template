import { isSetupComplete } from "@/server/settings";
import { redirect } from "next/navigation";
import { SetupWizard } from "@/components/setup-wizard";

export default async function SetupPage() {
  if (await isSetupComplete()) redirect("/");
  return (
    <div className="container-page grid place-items-center py-12">
      <div className="w-full max-w-2xl animate-fade-up">
        <div className="mb-8 text-center">
          <div className="chip mb-4 border-accent/30 bg-accent/10 text-accent">Konfiguracja początkowa</div>
          <h1 className="font-display text-3xl font-bold">Witaj w mcweb</h1>
          <p className="mt-2 text-ink-soft">Skonfiguruj swój serwer. Ten krok wykonuje się tylko raz.</p>
        </div>
        <SetupWizard />
      </div>
    </div>
  );
}
