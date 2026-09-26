import { NextResponse } from "next/server";
import { config } from "@/config/server";
import { randomToken } from "@/lib/utils";
import { cookies } from "next/headers";

export async function GET() {
  if (!config.discord.clientId) {
    return NextResponse.json({ error: "Discord OAuth nie skonfigurowany" }, { status: 503 });
  }
  const state = randomToken(16);
  const jar = await cookies();
  jar.set("discord_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  const { discordAuthorizeUrl } = await import("@/server/discord");
  return NextResponse.redirect(discordAuthorizeUrl(state));
}
