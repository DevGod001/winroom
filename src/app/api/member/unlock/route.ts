import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  AFFILIATE_CLICK_COOKIE,
  assertMemberCode,
  createVideoMemberCookieValue,
  isVideoGatingConfigured,
  isVideoGatingMisconfigured,
  requireAffiliateClickBeforeUnlock,
  verifyAffiliateClickCookie,
  VIDEO_MEMBER_COOKIE,
} from "@/lib/video-member-session";

const MEMBER_MAX_AGE = 90 * 24 * 60 * 60;

export async function POST(request: Request) {
  if (isVideoGatingMisconfigured()) {
    return NextResponse.json(
      { error: "Video library is not configured correctly (missing VIDEO_GATE_SECRET)." },
      { status: 503 },
    );
  }

  if (!isVideoGatingConfigured()) {
    return NextResponse.json(
      { error: "Member access is not enabled on this site." },
      { status: 400 },
    );
  }

  let body: { code?: string };
  try {
    body = (await request.json()) as { code?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (requireAffiliateClickBeforeUnlock()) {
    const store = await cookies();
    const click = store.get(AFFILIATE_CLICK_COOKIE)?.value;
    if (!verifyAffiliateClickCookie(click)) {
      return NextResponse.json(
        {
          error:
            "Open our registration link (Step 1) in this browser first, then enter your code. Or ask your admin to turn off REQUIRE_AFFILIATE_CLICK_BEFORE_UNLOCK if you switched devices.",
        },
        { status: 403 },
      );
    }
  }

  if (!assertMemberCode(body.code)) {
    return NextResponse.json({ error: "Invalid access code." }, { status: 401 });
  }

  let token: string;
  try {
    token = createVideoMemberCookieValue();
  } catch {
    return NextResponse.json({ error: "Server configuration error." }, { status: 500 });
  }

  const res = NextResponse.json({
    ok: true,
    message: "Library unlocked on this browser.",
  });
  res.cookies.set(VIDEO_MEMBER_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MEMBER_MAX_AGE,
  });
  return res;
}
