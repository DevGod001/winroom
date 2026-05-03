import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE_NAME,
  assertAdminPassword,
  createSessionToken,
} from "@/lib/admin-session";

const ONE_WEEK = 7 * 24 * 60 * 60;

export async function POST(request: Request) {
  let body: { password?: string; next?: string };
  try {
    body = (await request.json()) as { password?: string; next?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!assertAdminPassword(body.password)) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }

  let token: string;
  try {
    token = createSessionToken();
  } catch {
    return NextResponse.json(
      { error: "Server is not configured (ADMIN_SESSION_SECRET missing)." },
      { status: 500 },
    );
  }

  const nextPath =
    typeof body.next === "string" && body.next.startsWith("/") && !body.next.startsWith("//")
      ? body.next
      : "/videos/upload";

  const res = NextResponse.json({ ok: true, next: nextPath });
  res.cookies.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ONE_WEEK,
  });
  return res;
}
