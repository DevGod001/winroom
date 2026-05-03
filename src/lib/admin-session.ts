import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE_NAME = "admin_session";

function getSecret(): string | undefined {
  return process.env.ADMIN_SESSION_SECRET?.trim();
}

function signPayload(b64Payload: string, secret: string): string {
  return createHmac("sha256", secret).update(b64Payload).digest("base64url");
}

export function createSessionToken(): string {
  const secret = getSecret();
  if (!secret) {
    throw new Error("ADMIN_SESSION_SECRET is not set");
  }
  const exp = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60;
  const b64 = Buffer.from(JSON.stringify({ exp }), "utf8").toString("base64url");
  const sig = signPayload(b64, secret);
  return `${b64}.${sig}`;
}

export function verifySessionToken(token: string | undefined): boolean {
  if (!token) return false;
  const secret = getSecret();
  if (!secret) return false;

  const dot = token.indexOf(".");
  if (dot <= 0) return false;
  const b64 = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = signPayload(b64, secret);
  if (sig.length !== expected.length) return false;
  try {
    if (!timingSafeEqual(Buffer.from(sig, "utf8"), Buffer.from(expected, "utf8"))) {
      return false;
    }
  } catch {
    return false;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(b64, "base64url").toString("utf8"));
  } catch {
    return false;
  }
  if (
    typeof parsed !== "object" ||
    parsed === null ||
    typeof (parsed as { exp?: unknown }).exp !== "number"
  ) {
    return false;
  }
  const exp = (parsed as { exp: number }).exp;
  return exp >= Math.floor(Date.now() / 1000);
}

export async function verifyAdminSession(): Promise<boolean> {
  const store = await cookies();
  return verifySessionToken(store.get(ADMIN_COOKIE_NAME)?.value);
}

export function assertAdminPassword(password: unknown): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || typeof password !== "string") return false;
  try {
    const a = Buffer.from(password, "utf8");
    const b = Buffer.from(expected, "utf8");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
