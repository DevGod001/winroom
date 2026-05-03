"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { siteName } from "@/lib/brand";

export function UnlockForm({
  showAffiliateNote,
  redirectAfter = "/#lessons",
}: {
  showAffiliateNote: boolean;
  /** Safe internal path after unlock (e.g. `/#lessons`). Validated on the server. */
  redirectAfter?: string;
}) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/member/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      router.push(redirectAfter);
      router.refresh();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <h1 className="text-2xl font-bold text-white">Unlock the video library</h1>
      <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
        {siteName} only shows lessons to people who joined through our link and received a member
        code (for example via WhatsApp or Telegram after we confirm you in our partner dashboard).
      </p>
      {showAffiliateNote ? (
        <p className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/[0.07] px-3 py-2 text-xs text-amber-100/90">
          <strong className="text-amber-50">Strict mode:</strong> you must open our registration link
          (/go) in <strong className="text-amber-50">this same browser</strong> before the code will
          work.
        </p>
      ) : (
        <p className="mt-4 text-xs text-white/45">
          Tip: still use our link to register so you show up in our system — the code is only sent
          to confirmed referrals.
        </p>
      )}

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        <div>
          <label htmlFor="member-code" className="text-sm font-medium text-white/85">
            Member access code
          </label>
          <input
            id="member-code"
            name="code"
            type="text"
            autoComplete="off"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="mt-2 w-full rounded-xl border border-[var(--border)] bg-black/40 px-4 py-3 text-white placeholder:text-white/35 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
            placeholder="Paste your code"
            required
          />
        </div>
        {error ? (
          <p className="text-sm text-rose-400" role="alert">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-emerald-400 py-3 text-sm font-bold text-emerald-950 transition hover:bg-emerald-300 disabled:opacity-50"
        >
          {pending ? "Checking…" : "Unlock videos"}
        </button>
      </form>

      <p className="mt-8 text-sm text-[var(--muted)]">
        Registered through our link and need help after you are in our system?{" "}
        <Link href="/contact" className="font-medium text-emerald-400/90 hover:text-emerald-300">
          Contact us
        </Link>{" "}
        for funding walkthroughs, extra video topics, or unlock issues (we verify referrals before
        deep support).
      </p>

      <p className="mt-8 text-sm text-white/45">
        <Link href="/" className="text-emerald-400/90 hover:text-emerald-300">
          ← Back to home
        </Link>
      </p>
    </div>
  );
}
