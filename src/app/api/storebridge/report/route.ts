import { NextRequest, NextResponse } from "next/server";
import { reportJob } from "@/server/storebridge";
import { z } from "zod";

const Body = z.object({
  publicId: z.string(),
  claimToken: z.string(),
  success: z.boolean(),
  error: z.string().optional(),
});

// StoreBridge plugin reports job execution result. Idempotent via claimToken.

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-storebridge-secret") ?? "";
  if (secret !== process.env.STOREBRIDGE_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = Body.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid body" }, { status: 400 });

  try {
    const job = await reportJob(secret, parsed.data.publicId, parsed.data.claimToken, {
      success: parsed.data.success,
      error: parsed.data.error,
    });
    return NextResponse.json({ status: job.status });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
