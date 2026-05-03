import nodemailer from "nodemailer";
import { NextResponse } from "next/server";
import { siteName } from "@/lib/brand";
import { getContactToEmail } from "@/lib/contact-config";

const MAX_MSG = 8000;
const MAX_NAME = 120;

function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function smtpPassNormalized(raw: string): string {
  return raw.replace(/\s/g, "");
}

/** Different local part helps Gmail honor Reply-To when the inbox uses another +alias (e.g. +inbox). */
function defaultTaggedFrom(smtpUser: string, tag: string): string {
  const at = smtpUser.indexOf("@");
  if (at <= 0) return smtpUser;
  const local = smtpUser.slice(0, at);
  const domain = smtpUser.slice(at);
  if (local.includes("+")) return smtpUser;
  return `${local}+${tag}${domain}`;
}

/**
 * Sends contact mail via SMTP (Gmail: CONTACT_SMTP_USER + CONTACT_SMTP_APP_PASSWORD).
 * The password must be a Google "App password" (16 letters, from Google Account → Security),
 * not your normal Gmail password.
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  const o = body as Record<string, unknown>;
  const honeypot = typeof o.website === "string" ? o.website.trim() : "";
  if (honeypot.length > 0) {
    return NextResponse.json({ ok: true });
  }

  const email = typeof o.email === "string" ? o.email.trim() : "";
  const message = typeof o.message === "string" ? o.message.trim() : "";
  const name = typeof o.name === "string" ? o.name.trim() : "";

  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
  }
  if (name.length > MAX_NAME) {
    return NextResponse.json({ error: "Name is too long." }, { status: 400 });
  }
  if (message.length < 10 || message.length > MAX_MSG) {
    return NextResponse.json(
      { error: `Message must be between 10 and ${MAX_MSG} characters.` },
      { status: 400 },
    );
  }

  const to = getContactToEmail();
  const smtpUser = process.env.CONTACT_SMTP_USER?.trim();
  const smtpPassRaw = process.env.CONTACT_SMTP_APP_PASSWORD?.trim();
  const smtpPass = smtpPassRaw ? smtpPassNormalized(smtpPassRaw) : "";
  const fromMailbox =
    process.env.CONTACT_SMTP_FROM_EMAIL?.trim() ||
    defaultTaggedFrom(smtpUser || "", "site");

  const textLines = [
    `New message from ${siteName} contact form`,
    "",
    `Name: ${name || "(not provided)"}`,
    `Email: ${email}`,
    "",
    message,
  ];
  const text = textLines.join("\n");
  const safeName = name.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const safeMsg = message
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br/>");

  const html = `
    <p><strong>New message from ${siteName} contact form</strong></p>
    <p>Name: ${safeName || "(not provided)"}<br/>Email: ${email}</p>
    <hr/>
    <p>${safeMsg}</p>
  `.trim();

  const mailtoFallback = `mailto:${to}?subject=${encodeURIComponent(
    `[${siteName}] Question from website`,
  )}&body=${encodeURIComponent(message + `\n\n---\nMy email: ${email}\nName: ${name || ""}`)}`;

  if (!smtpUser || !smtpPass) {
    return NextResponse.json(
      {
        error: "Email sending is not configured on the server.",
        fallbackMailto: mailtoFallback,
      },
      { status: 503 },
    );
  }

  const hostEnv = process.env.CONTACT_SMTP_HOST?.trim();
  const portEnv = process.env.CONTACT_SMTP_PORT?.trim();
  const useGmailPreset =
    !hostEnv || hostEnv.toLowerCase() === "smtp.gmail.com";

  const transporter = useGmailPreset
    ? nodemailer.createTransport({
        service: "gmail",
        auth: { user: smtpUser, pass: smtpPass },
      })
    : nodemailer.createTransport({
        host: hostEnv,
        port: Number(portEnv || "465"),
        secure: Number(portEnv || "465") === 465,
        auth: { user: smtpUser, pass: smtpPass },
      });

  try {
    const info = await transporter.sendMail({
      from: `"${siteName}" <${fromMailbox}>`,
      to,
      replyTo: email,
      headers: {
        "Reply-To": email,
      },
      subject: `[${siteName}] Contact: ${name ? name.slice(0, 40) : email}`,
      text,
      html,
    });

    const messageId = info.messageId ?? null;
    console.log("[contact] SMTP accepted", {
      messageId,
      response: info.response,
      from: fromMailbox,
      to,
      replyTo: email,
      accepted: info.accepted,
      rejected: info.rejected,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    console.error("[contact] SMTP error", detail);
    const isDev = process.env.NODE_ENV === "development";
    return NextResponse.json(
      {
        error: "Could not send email right now. Try again or use the email address on the contact page.",
        fallbackMailto: mailtoFallback,
        ...(isDev
          ? {
              hint: "Local debug: Gmail needs a 16-character App Password (Google Account → Security → App passwords), not your normal Gmail password. Check the terminal for the full SMTP error.",
              smtpMessage: detail.slice(0, 300),
            }
          : {}),
      },
      { status: 502 },
    );
  }
}
