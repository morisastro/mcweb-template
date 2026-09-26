import { prisma } from "@/server/db";

export async function audit(
  action: string,
  opts: { actorId?: string; target?: string; ip?: string; meta?: Record<string, unknown> } = {},
): Promise<void> {
  await prisma.auditLog
    .create({
      data: {
        action,
        actorId: opts.actorId ?? null,
        target: opts.target ?? null,
        ip: opts.ip ?? null,
        meta: (opts.meta as any) ?? undefined,
      },
    })
    .catch(() => {
      // never let audit logging crash the request
    });
}
