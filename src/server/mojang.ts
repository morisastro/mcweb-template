import { config } from "@/config/server";

// Minecraft account verification via Mojang/Microsoft auth is complex.
// For self-hosting we use the Mojang API to resolve nick -> uuid and validate the
// account exists. Full Microsoft auth (msa) requires device code flow and is out of
// scope for a single web request; instead the "Minecraft login" lets a user claim a
// nick by entering it, we validate via Mojang, and the account becomes linked.
// Owners who want full verification can add a verification code challenge in-game later.

const NICK_RE = /^[A-Za-z0-9_]{3,16}$/;

export interface MinecraftProfile {
  uuid: string;
  username: string;
  skinUrl: string | null;
}

/** Validate nick format. */
export function isValidNick(nick: string): boolean {
  return NICK_RE.test(nick);
}

/** Convert undashed uuid to dashed form. */
export function dashUuid(uuid: string): string {
  const u = uuid.replace(/-/g, "");
  if (u.length !== 32) return uuid;
  return `${u.slice(0, 8)}-${u.slice(8, 12)}-${u.slice(12, 16)}-${u.slice(16, 20)}-${u.slice(20)}`;
}

/** Resolve a username to a Mojang profile (uuid + name). */
export async function resolveByUsername(username: string): Promise<MinecraftProfile | null> {
  if (!isValidNick(username)) return null;
  try {
    const res = await fetch(`${config.mojang.api}/users/profiles/minecraft/${encodeURIComponent(username)}`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
    });
    if (res.status === 404) return null;
    if (!res.ok) return null;
    const data = (await res.json()) as { id: string; name: string };
    const uuid = dashUUID(data.id);
    return { uuid, username: data.name, skinUrl: skinUrlFor(uuid) };
  } catch {
    return null;
  }
}

/** Look up profile by uuid (returns properties / skin). */
export async function profileByUuid(uuid: string): Promise<MinecraftProfile | null> {
  const dashed = uuid.includes("-") ? uuid : dashUUID(uuid);
  const clean = dashed.replace(/-/g, "");
  try {
    const res = await fetch(`https://sessionserver.mojang.com/session/minecraft/profile/${clean}`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { id: string; name: string };
    return { uuid: dashUUID(data.id), username: data.name, skinUrl: skinUrlFor(dashUUID(data.id)) };
  } catch {
    return null;
  }
}

export function skinUrlFor(uuid: string): string {
  return `https://crafatar.com/renders/body/${uuid}?size=128&overlay`;
}

export function headUrlFor(uuid: string): string {
  return `https://crafatar.com/avatars/${uuid}?size=64&overlay`;
}

// alias used elsewhere
export const dashUUID = dashUuid;
