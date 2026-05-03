import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const AFFILIATE_CLICK_COOKIE = "wr_aff_click";
export const VIDEO_MEMBER_COOKIE = "wr_video_member";

const COOKIE_VERSION = 1;
const MEMBER_MAX_AGE_SEC = 90 * 24 * 60 * 60;
const AFF_CLICK_MAX_AGE_SEC = 400 * 24 * 60 * 60;

function gateSecret(): string | undefined {
  return process.env.VIDEO_GATE_SECRET?.trim();
}

function sign(b64: string, secret: string): string {
  return createHmac("sha256", secret).update(b64).digest("base64url");
}

function timingSafeEqualStr(a: string, b: string): boolean {
  try {
    const ba = Buffer.from(a, "utf8");
    const bb = Buffer.from(b, "utf8");
    if (ba.length !== bb.length) return false;
    return timingSafeEqual(ba, bb);
  } catch {
    return false;
  }
}

/** Valid access codes from MEMBER_ACCESS_CODE or comma-separated MEMBER_ACCESS_CODES */
export function getMemberAccessCodes(): string[] {
  const single = process.env.MEMBER_ACCESS_CODE?.trim();
  const multi = process.env.MEMBER_ACCESS_CODES?.trim();
  const raw = multi || single;
  if (!raw) return [];
  return raw
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);
}

export function isVideoGatingConfigured(): boolean {
  return getMemberAccessCodes().length > 0 && Boolean(gateSecret());
}

/** Code set but secret missing — locked for everyone until fixed */
export function isVideoGatingMisconfigured(): boolean {
  return getMemberAccessCodes().length > 0 && !gateSecret();
}

export function assertMemberCode(plain: unknown): boolean {
  if (typeof plain !== "string") return false;
  const codes = getMemberAccessCodes();
  if (codes.length === 0) return false;
  const p = plain.trim();
  for (const c of codes) {
    if (timingSafeEqualStr(p, c)) return true;
  }
  return false;
}

export function createAffiliateClickCookieValue(): string {
  const secret = gateSecret();
  if (!secret) throw new Error("VIDEO_GATE_SECRET is not set");
  const iat = Math.floor(Date.now() / 1000);
  const b64 = Buffer.from(
    JSON.stringify({ v: COOKIE_VERSION, iat }),
    "utf8",
  ).toString("base64url");
  return `${b64}.${sign(b64, secret)}`;
}

export function createVideoMemberCookieValue(): string {
  const secret = gateSecret();
  if (!secret) throw new Error("VIDEO_GATE_SECRET is not set");
  const exp = Math.floor(Date.now() / 1000) + MEMBER_MAX_AGE_SEC;
  const b64 = Buffer.from(
    JSON.stringify({ v: COOKIE_VERSION, exp }),
    "utf8",
  ).toString("base64url");
  return `${b64}.${sign(b64, secret)}`;
}

function verifySignedCookie(
  token: string | undefined,
  secret: string,
  checker: (payload: unknown) => boolean,
): boolean {
  if (!token) return false;
  const dot = token.indexOf(".");
  if (dot <= 0) return false;
  const b64 = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = sign(b64, secret);
  if (!timingSafeEqualStr(sig, expected)) return false;
  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(b64, "base64url").toString("utf8"));
  } catch {
    return false;
  }
  return checker(parsed);
}

export function verifyAffiliateClickCookie(token: string | undefined): boolean {
  const secret = gateSecret();
  if (!secret) return false;
  const now = Math.floor(Date.now() / 1000);
  return verifySignedCookie(token, secret, (parsed) => {
    if (typeof parsed !== "object" || parsed === null) return false;
    const o = parsed as { v?: unknown; iat?: unknown };
    if (o.v !== COOKIE_VERSION || typeof o.iat !== "number") return false;
    return now - o.iat <= AFF_CLICK_MAX_AGE_SEC;
  });
}

export function verifyVideoMemberCookie(token: string | undefined): boolean {
  const secret = gateSecret();
  if (!secret) return false;
  const now = Math.floor(Date.now() / 1000);
  return verifySignedCookie(token, secret, (parsed) => {
    if (typeof parsed !== "object" || parsed === null) return false;
    const o = parsed as { v?: unknown; exp?: unknown };
    if (o.v !== COOKIE_VERSION || typeof o.exp !== "number") return false;
    return o.exp >= now;
  });
}

export async function hasVideoLibraryAccess(): Promise<boolean> {
  if (!getMemberAccessCodes().length) return true;
  if (!gateSecret()) return false;
  const store = await cookies();
  return verifyVideoMemberCookie(store.get(VIDEO_MEMBER_COOKIE)?.value);
}

export function requireAffiliateClickBeforeUnlock(): boolean {
  return process.env.REQUIRE_AFFILIATE_CLICK_BEFORE_UNLOCK?.trim() === "true";
}
