import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/server/auth";
import { prisma } from "@/server/db";

export async function GET(req: NextRequest) {
  await requireAdmin();
  const q = new URL(req.url).searchParams.get("q") ?? "";
  const users = await prisma.user.findMany({
    where: q
      ? {
          OR: [
            { displayName: { contains: q, mode: "insensitive" } },
            { minecraft: { username: { contains: q, mode: "insensitive" } } },
            { discord: { username: { contains: q, mode: "insensitive" } } },
          ],
        }
      : undefined,
    include: { discord: true, minecraft: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return NextResponse.json(users);
}
