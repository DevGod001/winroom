import { NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/admin-session";
import { bunnyCreateVideoAndTusCredentials } from "@/lib/bunny-stream";

export async function POST(request: Request) {
  if (!(await verifyAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { title?: string };
  try {
    body = (await request.json()) as { title?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const title =
    typeof body.title === "string" && body.title.trim() ? body.title.trim() : "Untitled";

  const result = await bunnyCreateVideoAndTusCredentials(title);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json(result.data);
}
