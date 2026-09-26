import { prisma } from "@/server/db";
import { config } from "@/config/server";
import { randomToken, shortId } from "@/lib/utils";
import { DeliveryStatus, DeliveryJob, Product, OrderItem } from "@prisma/client";

// ---------------------------------------------------------------------------
// StoreBridge delivery pipeline.
// Website -> Delivery Queue -> StoreBridge plugin -> Minecraft.
// The plugin authenticates with STOREBRIDGE_SECRET, claims a job by
// claimToken (preventing double execution), runs commands, reports status.
// ---------------------------------------------------------------------------

export interface EnqueueInput {
  orderId: string;
  userId?: string;
  item: OrderItem & { product: Product | null };
  playerNick: string;
  playerUuid?: string;
}

export async function enqueueDeliveries(input: {
  orderId: string;
  userId?: string;
  playerNick: string;
  playerUuid?: string;
  items: (OrderItem & { product: Product | null })[];
}): Promise<DeliveryJob[]> {
  const jobs: DeliveryJob[] = [];
  for (const item of input.items) {
    if (!item.product) continue;
    const commands = item.commands.length ? item.commands : item.product.commands;
    if (!commands.length) continue;
    const job = await prisma.deliveryJob.create({
      data: {
        publicId: shortId("DLV"),
        orderId: input.orderId,
        userId: input.userId ?? null,
        productId: item.productId,
        productName: item.name,
        playerNick: input.playerNick,
        playerUuid: input.playerUuid ?? null,
        modeId: item.product.modeId,
        commands,
        status: DeliveryStatus.WAITING,
        claimToken: randomToken(24),
      },
    });
    jobs.push(job);
  }
  return jobs;
}

export interface PluginClaim {
  modeId?: string; // plugin may request only jobs for its mode
  limit?: number;
}

/** Plugin fetches waiting jobs. Returns claim tokens + commands, marks PROCESSING. */
export async function claimJobs(secret: string, opts: PluginClaim): Promise<DeliveryJob[]> {
  if (secret !== config.storebridge.secret) {
    throw new Error("invalid storebridge secret");
  }
  const limit = Math.min(opts.limit ?? 10, 25);
  // atomic claim: select waiting jobs and set PROCESSING in a transaction
  return await prisma.$transaction(async (tx) => {
    const waiting = await tx.deliveryJob.findMany({
      where: {
        status: DeliveryStatus.WAITING,
        ...(opts.modeId ? { modeId: opts.modeId } : {}),
      },
      orderBy: { createdAt: "asc" },
      take: limit,
    });
    const now = new Date();
    const claimed = await Promise.all(
      waiting.map((j) =>
        tx.deliveryJob.update({
          where: { id: j.id },
          data: { status: DeliveryStatus.PROCESSING, claimedAt: now, attempts: { increment: 1 } },
        }),
      ),
    );
    return claimed;
  });
}

/** Plugin reports a single job result using claimToken (idempotent). */
export async function reportJob(
  secret: string,
  publicId: string,
  claimToken: string,
  result: { success: boolean; error?: string },
): Promise<DeliveryJob> {
  if (secret !== config.storebridge.secret) {
    throw new Error("invalid storebridge secret");
  }
  return await prisma.$transaction(async (tx) => {
    const job = await tx.deliveryJob.findUnique({ where: { publicId } });
    if (!job) throw new Error("job not found");
    if (job.claimToken !== claimToken) throw new Error("invalid claim token");
    // idempotency: already delivered -> no-op
    if (job.status === DeliveryStatus.DELIVERED) return job;
    if (result.success) {
      return tx.deliveryJob.update({
        where: { id: job.id },
        data: { status: DeliveryStatus.DELIVERED, deliveredAt: new Date(), lastError: null },
      });
    }
    // failure: reset to WAITING so it can be retried later (server may have been offline)
    return tx.deliveryJob.update({
      where: { id: job.id },
      data: {
        status: DeliveryStatus.WAITING,
        lastError: result.error ?? "unknown error",
      },
    });
  });
}

/** Render commands for a player with safe nick substitution. */
export function renderCommands(commands: string[], playerNick: string): string[] {
  // strict nick validation before substitution to prevent command injection
  if (!/^[A-Za-z0-9_]{3,16}$/.test(playerNick)) {
    throw new Error("invalid player nick");
  }
  return commands.map((c) => c.replaceAll("{player}", playerNick));
}

export function jobToPayload(job: DeliveryJob) {
  return {
    publicId: job.publicId,
    claimToken: job.claimToken,
    playerName: job.playerNick,
    playerUuid: job.playerUuid,
    modeId: job.modeId,
    productName: job.productName,
    commands: renderCommands(job.commands, job.playerNick),
  };
}
