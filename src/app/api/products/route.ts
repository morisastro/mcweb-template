import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db";

export async function GET(req: NextRequest) {
  const slug = new URL(req.url).searchParams.get("mode");
  const where = slug ? { mode: { slug }, active: true } : { active: true };
  const products = await prisma.product.findMany({
    where,
    include: { mode: true, category: true },
    orderBy: { sort: "asc" },
  });
  const categories = await prisma.category.findMany({ orderBy: { order: "asc" } });
  return NextResponse.json({ products, categories });
}
