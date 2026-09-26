import { prisma } from "@/server/db";
import { randomToken, shortId } from "@/lib/utils";
import { enqueueDeliveries } from "@/server/storebridge";
import { Reward, RewardClaim, User, MinecraftAccount, DiscordAccount } from "@prisma/client";
import { audit } from "@/server/audit";

// ---------------------------------------------------------------------------
// Rewards engine. Evaluates requirement JSON, computes progress, and on
// claim enqueues DeliveryJobs (minecraft commands) + discord roles.
// ---------------------------------------------------------------------------

export interface RewardRequirementConfig {
  minutes?: number; // playtime
  days?: number; // daily streak (simple: 1 = once per day)
  code?: string; // promo code
  custom?: string; // freeform label
}

export interface RewardProgress {
  current: number;
  required: number;
  complete: boolean;
  reason?: string;
}

type FullUser = User & { discord: DiscordAccount | null; minecraft: MinecraftAccount | null };

export async function evaluateReward(reward: Reward, user: FullUser): Promise<RewardProgress> {
  const req = (reward.requirement ?? {}) as RewardRequirementConfig;

  switch (reward.type) {
    case "DISCORD_LINK":
      return ok(user.discord !== null, "Połącz konto Discord");

    case "MC_LINK":
      return ok(user.minecraft !== null, "Połącz konto Minecraft");

    case "BOTH_LINK":
      return ok(user.discord !== null && user.minecraft !== null, "Połącz oba konta");

    case "BOOST":
      return ok(user.discord?.isBooster === true, "Zboostuj serwer na Discordzie");

    case "PLAYTIME": {
      const required = req.minutes ?? 60;
      return { current: user.playtimeSec / 60, required, complete: user.playtimeSec / 60 >= required };
    }

    case "DAILY":
      return { current: 0, required: 1, complete: await canClaimDaily(user.id, reward.id) };

    case "PROMO_CODE":
      // validated separately via /api/rewards/redeem
      return { current: 0, required: 1, complete: false, reason: "Wymaga kodu promocyjnego" };

    case "MEDIA":
      return { current: 0, required: 1, complete: false, reason: "Wymaga zatwierdzonego zgłoszenia Media" };

    case "EVENT":
    case "CUSTOM":
    default:
      return { current: 0, required: 1, complete: false, reason: "Nagroda specjalna" };
  }
}

function ok(complete: boolean, reason: string): RewardProgress {
  return { current: complete ? 1 : 0, required: 1, complete, reason: complete ? undefined : reason };
}

async function canClaimDaily(userId: string, rewardId: string): Promise<boolean> {
  const last = await prisma.rewardClaim.findUnique({ where: { userId_rewardId: { userId, rewardId } } });
  if (!last) return true;
  const since = Date.now() - last.createdAt.getTime();
  return since > 24 * 3600 * 1000;
}

export async function claimReward(rewardId: string, user: FullUser): Promise<{ ok: boolean; error?: string }> {
  const reward = await prisma.reward.findUnique({ where: { id: rewardId } });
  if (!reward || !reward.active) return { ok: false, error: "Nagroda niedostępna" };

  const existing = await prisma.rewardClaim.findUnique({ where: { userId_rewardId: { userId: user.id, rewardId } } });
  if (existing && reward.claimLimit <= 1) {
    return { ok: false, error: "Nagrodę już odebrano" };
  }

  const progress = await evaluateReward(reward, user);
  if (!progress.complete) return { ok: false, error: progress.reason ?? "Wymagania niespełnione" };

  // upsert claim
  const claim = await prisma.rewardClaim.upsert({
    where: { userId_rewardId: { userId: user.id, rewardId } },
    update: { status: "CLAIMED", createdAt: new Date() },
    create: { userId: user.id, rewardId, status: "CLAIMED", progress: 1 },
  });

  // enqueue minecraft commands
  if (user.minecraft && reward.commands.length) {
    await enqueueDeliveries({
      orderId: `reward:${claim.id}`,
      userId: user.id,
      playerNick: user.minecraft.username,
      playerUuid: user.minecraft.uuid,
      items: [
        {
          id: "reward",
          orderId: "",
          productId: null,
          name: reward.name,
          product: {
            id: rewardId,
            modeId: "reward",
            commands: reward.commands,
          } as any,
          playerNick: "",
          commands: reward.commands,
        } as any,
      ],
    });
  }

  // discord roles
  if (user.discord && reward.discordRoleIds.length) {
    const { syncRoles } = await import("@/server/discord");
    for (const rid of reward.discordRoleIds) await syncRoles(user.discord.discordId, [rid]);
  }

  await audit("reward.claim", { actorId: user.id, target: reward.slug });
  return { ok: true };
}

export async function redeemCode(user: FullUser, code: string): Promise<{ ok: boolean; error?: string }> {
  const reward = await prisma.reward.findFirst({ where: { type: "PROMO_CODE", active: true } });
  if (!reward) return { ok: false, error: "Brak aktywnych nagród kodowych" };
  const req = (reward.requirement ?? {}) as RewardRequirementConfig;
  if (req.code && req.code.toUpperCase() !== code.trim().toUpperCase()) {
    return { ok: false, error: "Nieprawidłowy kod" };
  }
  return claimReward(reward.id, user);
}
