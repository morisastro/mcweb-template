// Seed: creates default categories and a sample reward set.
// Run with: npm run db:seed  (after setup wizard or standalone)
import { prisma } from "@/server/db";

async function main() {
  const categories = [
    { slug: "rangi", name: "Rangi", order: 0 },
    { slug: "klucze", name: "Klucze", order: 1 },
    { slug: "waluta", name: "Waluta", order: 2 },
    { slug: "przedmioty", name: "Przedmioty", order: 3 },
    { slug: "pakiety", name: "Pakiety", order: 4 },
  ];
  for (const c of categories) {
    await prisma.category.upsert({ where: { slug: c.slug }, update: {}, create: c });
  }

  const rewards = [
    { slug: "discord-link", name: "Połączenie Discord", type: "DISCORD_LINK" as const, requirement: {}, commands: ["lp user {player} permission set discord.linked true"], claimLimit: 1, order: 0 },
    { slug: "mc-link", name: "Połączenie Minecraft", type: "MC_LINK" as const, requirement: {}, commands: [], claimLimit: 1, order: 1 },
    { slug: "both-link", name: "Połączenie obu kont", type: "BOTH_LINK" as const, requirement: {}, commands: ["lp user {player} parent add linked"], claimLimit: 1, order: 2 },
    { slug: "daily", name: "Nagroda dzienna", type: "DAILY" as const, requirement: { days: 1 }, commands: ["give {player} diamond 1"], claimLimit: 1, order: 3 },
    { slug: "playtime-2h", name: "2 godziny gry", type: "PLAYTIME" as const, requirement: { minutes: 120 }, commands: ["give {player} gold_ingot 16"], claimLimit: 1, order: 4 },
    { slug: "media", name: "Nagroda Media", type: "MEDIA" as const, requirement: {}, commands: ["lp user {player} parent add media"], discordRoleIds: [], claimLimit: 1, order: 5 },
  ];
  for (const r of rewards) {
    await prisma.reward.upsert({ where: { slug: r.slug }, update: {}, create: r });
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
