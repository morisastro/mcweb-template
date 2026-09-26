import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const modes = await prisma.serverMode.findMany({
    where: { visible: true },
    orderBy: { order: "asc" },
  });
  return NextResponse.json(modes);
}
