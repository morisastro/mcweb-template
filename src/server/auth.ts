import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { prisma } from "@/server/db";
import { config } from "@/config/server";
import { randomToken } from "@/lib/utils";

const COOKIE = config.auth.sessionCookie;
const TTL = config.auth.sessionTtl;

export interface SessionUser {
  id: string;
  role: string;
  displayName: string | null;
  hasDiscord: boolean;
  hasMinecraft: boolean;
  minecraftNick: string | null;
  minecraftUuid: string | null;
  discordId: string | null;
  avatar: string | null;
}

function toSessionUser(u: Awaited<ReturnType<typeof loadFullUser>>): SessionUser | null {
  if (!u) return null;
  return {
    id: u.id,
    role: u.role,
    displayName: u.displayName,
    hasDiscord: !!u.discord,
    hasMinecraft: !!u.minecraft,
    minecraftNick: u.minecraft?.username ?? null,
    minecraftUuid: u.minecraft?.uuid ?? null,
    discordId: u.discord?.discordId ?? null,
    avatar: u.discord?.avatarUrl ?? u.minecraft?.skinUrl ?? null,
  };
}

async function loadFullUser(id: string) {
  return prisma.user.findUnique({
    where: { id },
    include: { discord: true, minecraft: true },
  });
}

export async function createSession(userId: string, req?: NextRequest): Promise<string> {
  const token = randomToken(32);
  const ip = req?.headers.get("x-forwarded-for")?.split(",")[0] ?? null;
  const ua = req?.headers.get("user-agent") ?? null;
  await prisma.session.create({
    data: {
      userId,
      token,
      ip,
      userAgent: ua,
      expiresAt: new Date(Date.now() + TTL * 1000),
    },
  });
  return token;
}

export async function setSessionCookie(token: string): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: TTL,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: { include: { discord: true, minecraft: true } } },
  });
  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }
  return toSessionUser(session.user);
}

export async function requireUser(): Promise<SessionUser> {
  const u = await getSessionUser();
  if (!u) throw new Response("Unauthorized", { status: 401 });
  return u;
}

const STAFF = new Set(["STAFF", "ADMIN", "OWNER"]);

export async function requireStaff(): Promise<SessionUser> {
  const u = await requireUser();
  if (!STAFF.has(u.role)) throw new Response("Forbidden", { status: 403 });
  return u;
}

export async function requireAdmin(): Promise<SessionUser> {
  const u = await requireUser();
  if (u.role !== "ADMIN" && u.role !== "OWNER") throw new Response("Forbidden", { status: 403 });
  return u;
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await prisma.session.deleteMany({ where: { token } }).catch(() => {});
  jar.delete(COOKIE);
}
