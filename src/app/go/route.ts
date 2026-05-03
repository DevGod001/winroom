import { NextResponse } from "next/server";
import {
  attachAffiliateClickCookie,
  getDerivAffiliateUrl,
} from "@/lib/deriv-affiliate";

/**
 * 302 redirect to Deriv affiliate URL from env.
 * Sets a first-party cookie when video gating is configured (proves this browser used our link).
 */
export async function GET() {
  const url = getDerivAffiliateUrl();
  if (!url) {
    return new NextResponse(
      "Registration link is not configured. Set DERIV_AFFILIATE_URL in the environment (e.g. in Vercel project settings).",
      { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } },
    );
  }

  const res = NextResponse.redirect(url, 302);
  attachAffiliateClickCookie(res);
  return res;
}
