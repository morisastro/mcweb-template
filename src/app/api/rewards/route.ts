import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { getSessionUser } from "@/server/auth";
import { evaluateReward } from "@/server/rewards";

export async function GET() {
  const user = await getSessionUser();
  const full = user
    ? await prisma.user.findUnique({ where: { id: user.id }, include: { discord: true, minecraft: true } })
    : null;

  const rewards = await prisma.reward.findMany({ where: { active: true }, orderBy: { order: "asc" } });

  const out = await Promise.all(
    rewards.map(async (r) => {
      const claim = full
        ? await prisma.rewardClaim.findUnique({ where: { userId_rewardId: { userId: full.id, rewardId: r.id } } })
        : null;
      const progress = full ? await evaluateReward(r, full) : { current: 0, required: 1, complete: false, reason: "Zaloguj się" };
      return {
        id: r.id,
        slug: r.slug,
        name: r.name,
        description: r.description,
        type: r.type,
        icon: r.icon,
        progress,
        claimed: !!claim,
        claimLimit: r.claimLimit,
      };
    }),
  );

  return NextResponse.json(out);
}
