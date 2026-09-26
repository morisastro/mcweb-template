import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/server/db";
import { config } from "@/config/server";
import { getSessionUser, createSession, setSessionCookie } from "@/server/auth";
import { exchangeCode, getDiscordUser, avatarUrl, getGuildMember } from "@/server/discord";
import { audit } from "@/server/audit";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const jar = await cookies();
  const stored = jar.get("discord_oauth_state")?.value;
  jar.delete("discord_oauth_state");

  const next = url.searchParams.get("next") || "/konto";

  if (!code || !state || state !== stored) {
    return NextResponse.redirect(new URL("/login?error=state", config.appUrl));
  }
  if (!config.discord.clientId || !config.discord.clientSecret) {
    return NextResponse.redirect(new URL("/login?error=config", config.appUrl));
  }

  const tokens = await exchangeCode(code);
  if (!tokens) return NextResponse.redirect(new URL("/login?error=exchange", config.appUrl));

  const dUser = await getDiscordUser(tokens.access_token);
  if (!dUser) return NextResponse.redirect(new URL("/login?error=user", config.appUrl));

  const member = await getGuildMember(tokens.access_token).catch(() => null);
  const av = avatarUrl(dUser);

  const current = await getSessionUser();

  // Upsert DiscordAccount -> link to existing User (current session) or create one
  const existingDiscord = await prisma.discordAccount.findUnique({
    where: { discordId: dUser.id },
    include: { user: true },
  });

  let userId: string;

  if (current) {
    // linking to current account
    userId = current.id;
    if (existingDiscord && existingDiscord.userId !== current.id) {
      // discord already linked elsewhere — steal-link to current (merge not automatic)
      await prisma.discordAccount.update({
        where: { id: existingDiscord.id },
        data: { userId: current.id },
      });
    } else if (!existingDiscord) {
      await prisma.discordAccount.create({
        data: {
          userId: current.id,
          discordId: dUser.id,
          username: dUser.global_name ?? dUser.username,
          discriminator: dUser.discriminator,
          avatarUrl: av,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
          isBooster: !!member?.premium_since,
          roleIds: member?.roles ?? [],
        },
      });
    } else {
      await prisma.discordAccount.update({
        where: { id: existingDiscord.id },
        data: {
          username: dUser.global_name ?? dUser.username,
          avatarUrl: av,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
          isBooster: !!member?.premium_since,
          roleIds: member?.roles ?? [],
        },
      });
    }
  } else {
    // no session -> login or register
    if (existingDiscord) {
      userId = existingDiscord.userId;
      await prisma.discordAccount.update({
        where: { id: existingDiscord.id },
        data: {
          username: dUser.global_name ?? dUser.username,
          avatarUrl: av,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
          isBooster: !!member?.premium_since,
          roleIds: member?.roles ?? [],
        },
      });
    } else {
      const user = await prisma.user.create({
        data: {
          displayName: dUser.global_name ?? dUser.username,
          email: dUser.email ?? null,
          discord: {
            create: {
              discordId: dUser.id,
              username: dUser.global_name ?? dUser.username,
              discriminator: dUser.discriminator,
              avatarUrl: av,
              accessToken: tokens.access_token,
              refreshToken: tokens.refresh_token,
              tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
              isBooster: !!member?.premium_since,
              roleIds: member?.roles ?? [],
            },
          },
        },
        include: { discord: true },
      });
      userId = user.id;
    }
  }

  await prisma.user.update({ where: { id: userId }, data: { lastLoginAt: new Date() } });
  const token = await createSession(userId, req);
  await setSessionCookie(token);
  await audit("auth.discord", { actorId: userId, ip: req.headers.get("x-forwarded-for") ?? undefined });

  return NextResponse.redirect(new URL(next, config.appUrl));
}
