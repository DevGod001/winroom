import { NextResponse } from "next/server";
import {
  attachAffiliateClickCookie,
  getDerivAffiliateUrl,
} from "@/lib/deriv-affiliate";

/**
 * JSON affiliate URL for in-site registration (modal iframe).
 * Sets the same affiliate-click cookie as GET /go when gating is configured.
 */
export async function GET() {
  const url = getDerivAffiliateUrl();
  if (!url) {
    return NextResponse.json(
      { error: "Registration link is not configured." },
      { status: 503 },
    );
  }
  const res = NextResponse.json({ url });
  attachAffiliateClickCookie(res);
  return res;
}
