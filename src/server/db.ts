import { PrismaClient } from "@prisma/client";

// In production: standard Prisma + PostgreSQL via DATABASE_URL.
// In local tests (DATABASE_URL=mock://): use an in-memory mock so the app boots
// without any external database. Schema is not persisted — data resets on restart.
// This is ONLY for local UI testing. Real deployments use PostgreSQL via docker-compose.

const USE_MOCK = process.env.DATABASE_URL?.startsWith("mock://");

let prisma: PrismaClient;

if (USE_MOCK) {
  console.log("[db] using in-memory mock (local test mode only)");
  const mod = await import("./db-mock");
  prisma = await mod.createMockPrisma();
} else {
  prisma = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export { prisma };
