"use client";

import { useState } from "react";
import { siteName } from "@/lib/brand";
import { CONTACT_BRAND_EMAIL, CONTACT_INBOX } from "@/lib/contact-config";

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [errorDetail, setErrorDetail] = useState<string | null>(null);
  const [fallbackMailto, setFallbackMailto] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setErrorDetail(null);
    setFallbackMailto(null);
    setPending(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message, website }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        fallbackMailto?: string;
        hint?: string;
        smtpMessage?: string;
      };
      if (res.ok && data.ok) {
        setSent(true);
        return;
      }
      if (data.fallbackMailto) {
        setFallbackMailto(data.fallbackMailto);
      }
      setError(data.error ?? "Something went wrong.");
      if (data.hint || data.smtpMessage) {
        setErrorDetail(
          [data.hint, data.smtpMessage].filter(Boolean).join("\n\n"),
        );
      }
    } catch {
      setError("Network error. Try again.");
    } finally {
      setPending(false);
    }
  }

  if (sent) {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.08] px-5 py-8 text-center">
        <p className="text-sm font-semibold text-emerald-100">Message sent</p>
        <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
          Thanks — we have your note and will reply to the email address you entered when we can.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <input
        type="text"
        name="website"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        className="pointer-events-none absolute left-[-9999px] h-0 w-0 opacity-0"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
      />

      <div>
        <label htmlFor="contact-name" className="text-sm font-medium text-white/85">
          Name <span className="font-normal text-white/45">(optional)</span>
        </label>
        <input
          id="contact-name"
          type="text"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-2 w-full rounded-xl border border-[var(--border)] bg-black/40 px-4 py-3 text-white placeholder:text-white/35 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
          placeholder="Your name"
        />
      </div>

      <div>
        <label htmlFor="contact-email" className="text-sm font-medium text-white/85">
          Email <span className="text-rose-300">*</span>
        </label>
        <input
          id="contact-email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-2 w-full rounded-xl border border-[var(--border)] bg-black/40 px-4 py-3 text-white placeholder:text-white/35 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
          placeholder="you@example.com"
        />
        <p className="mt-1.5 text-xs text-white/45">
          Use an email we can reply to. If you signed up with Deriv through our link, mention the
          email or ID you use there so we can confirm you faster.
        </p>
      </div>

      <div>
        <label htmlFor="contact-message" className="text-sm font-medium text-white/85">
          Message <span className="text-rose-300">*</span>
        </label>
        <textarea
          id="contact-message"
          required
          rows={6}
          minLength={10}
          maxLength={8000}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="mt-2 w-full resize-y rounded-xl border border-[var(--border)] bg-black/40 px-4 py-3 text-white placeholder:text-white/35 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
          placeholder="e.g. funding walkthrough, extra video topics, unlock help…"
        />
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          <p role="alert">{error}</p>
          {errorDetail ? (
            <pre className="mt-3 max-h-40 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-black/40 p-3 text-[11px] leading-snug text-amber-100/90">
              {errorDetail}
            </pre>
          ) : null}
          {fallbackMailto ? (
            <a
              href={fallbackMailto}
              className="mt-3 inline-block font-semibold text-emerald-400 underline-offset-2 hover:underline"
            >
              Open in your email app instead →
            </a>
          ) : null}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-emerald-400 py-3 text-sm font-bold text-emerald-950 transition hover:bg-emerald-300 disabled:opacity-50"
      >
        {pending ? "Sending…" : "Send message"}
      </button>

      <p className="text-center text-[11px] leading-relaxed text-white/40">
        Or email{" "}
        <a
          href={`mailto:${CONTACT_INBOX}`}
          className="font-medium text-emerald-400/90 underline-offset-2 hover:underline"
        >
          {CONTACT_INBOX}
        </a>{" "}
        (same inbox as {CONTACT_BRAND_EMAIL}). {siteName} does not promise instant replies.
      </p>
    </form>
  );
}
