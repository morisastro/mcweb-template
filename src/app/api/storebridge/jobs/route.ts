import { NextRequest, NextResponse } from "next/server";
import { claimJobs, jobToPayload } from "@/server/storebridge";
import { ipRateLimit, rateLimitHeaders } from "@/server/ratelimit";

// StoreBridge plugin fetches pending DeliveryJobs here.
// Auth via x-storebridge-secret header.

export async function GET(req: NextRequest) {
  const rl = ipRateLimit(req, "sb-fetch", 60, 10_000);
  if (!rl.ok) return rateLimitHeaders(NextResponse.json({ error: "slow down" }, { status: 429 }), rl, 60);

  const secret = req.headers.get("x-storebridge-secret") ?? "";
  if (secret !== process.env.STOREBRIDGE_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const modeId = url.searchParams.get("modeId") ?? undefined;
  const limit = Number(url.searchParams.get("limit") ?? 10);

  try {
    const jobs = await claimJobs(secret, { modeId, limit });
    return NextResponse.json({ jobs: jobs.map(jobToPayload) });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 403 });
  }
}
