"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type LoginFormProps = {
  redirectTo: string;
};

export function LoginForm({ redirectTo }: LoginFormProps) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, next: redirectTo }),
      });
      const data = (await res.json()) as { error?: string; next?: string };
      if (!res.ok) {
        setError(data.error ?? "Login failed.");
        return;
      }
      router.push(data.next ?? redirectTo);
      router.refresh();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto flex w-full max-w-md flex-col gap-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8"
    >
      <div>
        <h1 className="text-xl font-semibold text-white">Admin sign in</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Upload access only. Use the password from your server environment.
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="admin-password" className="text-sm font-medium text-white/80">
          Password
        </label>
        <input
          id="admin-password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-xl border border-[var(--border)] bg-black/40 px-4 py-3 text-white placeholder:text-white/35 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
          placeholder="ADMIN_PASSWORD"
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
        className="rounded-xl bg-emerald-400 py-3 font-semibold text-emerald-950 transition hover:bg-emerald-300 disabled:opacity-50"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
