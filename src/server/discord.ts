import { config } from "@/config/server";

// Minimal Discord OAuth2 + REST helpers. No SDK needed.

const API = "https://discord.com/api/v10";

export interface DiscordTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
}

export interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  global_name?: string | null;
  avatar: string | null;
  email?: string;
}

export interface DiscordGuildMember {
  roles: string[];
  premium_since: string | null;
}

export function discordAuthorizeUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: config.discord.clientId,
    redirect_uri: config.discord.redirectUri,
    response_type: "code",
    scope: "identify email guilds",
    state,
  });
  return `${API}/oauth2/authorize?${params.toString()}`;
}

export async function exchangeCode(code: string): Promise<DiscordTokenResponse | null> {
  if (!config.discord.clientId || !config.discord.clientSecret) return null;
  const body = new URLSearchParams({
    client_id: config.discord.clientId,
    client_secret: config.discord.clientSecret,
    grant_type: "authorization_code",
    code,
    redirect_uri: config.discord.redirectUri,
  });
  const res = await fetch(`${API}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) return null;
  return (await res.json()) as DiscordTokenResponse;
}

export async function getDiscordUser(accessToken: string): Promise<DiscordUser | null> {
  const res = await fetch(`${API}/users/@me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return null;
  return (await res.json()) as DiscordUser;
}

export async function getGuildMember(accessToken: string): Promise<DiscordGuildMember | null> {
  const guildId = config.discord.guildId;
  if (!guildId) return null;
  const res = await fetch(`${API}/users/@me/guilds/${guildId}/member`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return null;
  return (await res.json()) as DiscordGuildMember;
}

export function avatarUrl(user: DiscordUser): string | null {
  if (user.avatar) {
    const ext = user.avatar.startsWith("a_") ? "gif" : "png";
    return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${ext}?size=256`;
  }
  return null;
}

// --- Bot REST (uses bot token) ---

async function botFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bot ${config.discord.botToken}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
}

export function isDiscordConfigured(): boolean {
  return !!(config.discord.clientId && config.discord.clientSecret);
}

export function isBotConfigured(): boolean {
  return !!config.discord.botToken && !!config.discord.guildId;
}

export async function addRole(discordId: string, roleId: string): Promise<boolean> {
  if (!isBotConfigured()) return false;
  const res = await botFetch(`/guilds/${config.discord.guildId}/members/${discordId}/roles/${roleId}`, {
    method: "PUT",
  });
  return res.ok || res.status === 204;
}

export async function removeRole(discordId: string, roleId: string): Promise<boolean> {
  if (!isBotConfigured()) return false;
  const res = await botFetch(`/guilds/${config.discord.guildId}/members/${discordId}/roles/${roleId}`, {
    method: "DELETE",
  });
  return res.ok || res.status === 204;
}

export async function syncRoles(discordId: string, roleIds: string[]): Promise<void> {
  if (!isBotConfigured()) return;
  for (const id of roleIds) await addRole(discordId, id);
}

export async function sendWebhook(webhookUrl: string, payload: Record<string, unknown>): Promise<void> {
  if (!webhookUrl) return;
  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    // ignore
  }
}
