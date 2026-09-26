import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/server/auth";
import { prisma } from "@/server/db";

export async function GET() {
  await requireAdmin();
  return NextResponse.json(
    await prisma.mediaApplication.findMany({
      orderBy: { createdAt: "desc" },
      include: { user: { include: { minecraft: true, discord: true } } },
    }),
  );
}

// Review: approve / reject / needs_info / set expiry
export async function PUT(req: NextRequest) {
  const s = await requireAdmin();
  const body = await req.json().catch(() => ({}));
  const { id, action, note, expiresAt } = body as { id?: string; action?: string; note?: string; expiresAt?: string };
  if (!id || !action) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const status =
    action === "approve" ? "APPROVED" :
    action === "reject" ? "REJECTED" :
    action === "needs_info" ? "NEEDS_INFO" : action === "expire" ? "EXPIRED" : null;
  if (!status) return NextResponse.json({ error: "invalid action" }, { status: 400 });

  const app = await prisma.mediaApplication.update({
    where: { id },
    data: { status: status as any, reviewerId: s.id, reviewNote: note ?? null, expiresAt: expiresAt ? new Date(expiresAt) : undefined },
    include: { user: { include: { minecraft: true } } },
  });

  // On approve, enqueue a Media reward's delivery jobs + discord roles (if configured)
  if (status === "APPROVED") {
    const mediaReward = await prisma.reward.findFirst({ where: { type: "MEDIA", active: true } });
    if (mediaReward && app.user.minecraft && mediaReward.commands.length) {
      const { enqueueDeliveries } = await import("@/server/storebridge");
      await enqueueDeliveries({
        orderId: `media:${app.id}`,
        userId: app.userId,
        playerNick: app.user.minecraft.username,
        playerUuid: app.user.minecraft.uuid,
        items: [{
          id: "media", orderId: "", productId: null, name: "Nagroda Media",
          product: { id: mediaReward.id, modeId: "media", commands: mediaReward.commands } as any,
          playerNick: "", commands: mediaReward.commands,
        } as any],
      });
    }
  }

  return NextResponse.json(app);
}
