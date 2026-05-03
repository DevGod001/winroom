import type { NextResponse } from "next/server";
import {
  AFFILIATE_CLICK_COOKIE,
  createAffiliateClickCookieValue,
} from "@/lib/video-member-session";

const ONE_YEAR = 400 * 24 * 60 * 60;

export function getDerivAffiliateUrl(): string | null {
  const url = process.env.DERIV_AFFILIATE_URL?.trim();
  if (!url || !/^https?:\/\//i.test(url)) return null;
  return url;
}

/** When video gating is configured, records that this browser used our affiliate entry point. */
export function attachAffiliateClickCookie(res: NextResponse): void {
  if (!process.env.VIDEO_GATE_SECRET?.trim()) return;
  try {
    res.cookies.set(AFFILIATE_CLICK_COOKIE, createAffiliateClickCookieValue(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: ONE_YEAR,
    });
  } catch {
    /* ignore */
  }
}
