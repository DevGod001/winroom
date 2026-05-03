"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";

type RegisterContextValue = { open: () => void };

const RegisterContext = createContext<RegisterContextValue | null>(null);

export function useDerivRegister(): RegisterContextValue {
  const c = useContext(RegisterContext);
  if (!c) {
    throw new Error("useDerivRegister must be used within DerivRegisterGate");
  }
  return c;
}

export function DerivRegisterGate({ children }: { children: ReactNode }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [openGeneration, setOpenGeneration] = useState(0);
  const [frameUrl, setFrameUrl] = useState<string | null>(null);
  const [loadState, setLoadState] = useState<"idle" | "loading" | "ready" | "error">(
    "idle",
  );

  const resetContent = useCallback(() => {
    setFrameUrl(null);
    setLoadState("idle");
  }, []);

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    const onDialogClose = () => {
      resetContent();
    };
    d.addEventListener("close", onDialogClose);
    return () => d.removeEventListener("close", onDialogClose);
  }, [resetContent]);

  useEffect(() => {
    if (openGeneration === 0) return;

    let cancelled = false;
    setLoadState("loading");
    setFrameUrl(null);

    fetch("/api/deriv/affiliate-url", { credentials: "same-origin" })
      .then(async (r) => {
        if (!r.ok) throw new Error("affiliate url unavailable");
        const data = (await r.json()) as { url?: string };
        if (cancelled || !data.url) return;
        setFrameUrl(data.url);
        setLoadState("ready");
      })
      .catch(() => {
        if (!cancelled) setLoadState("error");
      });

    return () => {
      cancelled = true;
    };
  }, [openGeneration]);

  const open = useCallback(() => {
    resetContent();
    setOpenGeneration((g) => g + 1);
    dialogRef.current?.showModal();
  }, [resetContent]);

  return (
    <RegisterContext.Provider value={{ open }}>
      {children}
      <dialog
        ref={dialogRef}
        className="deriv-register-dialog fixed inset-0 z-[100] m-auto max-h-[90vh] w-[min(100vw-1.5rem,56rem)] max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--background)] p-0 text-[var(--foreground)] shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-[var(--border)] px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white">Register on Deriv</p>
            <p className="mt-0.5 text-xs text-[var(--muted)]">
              Complete sign-up in the window below. This page stays open behind it.
            </p>
          </div>
          <button
            type="button"
            className="shrink-0 rounded-lg px-2 py-1 text-sm text-white/60 transition hover:bg-white/10 hover:text-white"
            onClick={() => dialogRef.current?.close()}
            aria-label="Close registration"
          >
            ×
          </button>
        </div>

        <div className="relative min-h-[min(70vh,640px)] flex-1 bg-black/40">
          {loadState === "loading" ? (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-[var(--muted)]">
              Loading registration…
            </div>
          ) : null}
          {loadState === "error" ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
              <p className="text-sm text-[var(--muted)]">
                Registration could not be loaded here.
              </p>
              <a
                href="/go"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl bg-emerald-400 px-6 py-3 text-sm font-bold text-emerald-950 transition hover:bg-emerald-300"
              >
                Open Deriv in a new tab
              </a>
            </div>
          ) : null}
          {frameUrl ? (
            <iframe
              title="Deriv registration"
              src={frameUrl}
              className="h-full min-h-[min(70vh,640px)] w-full border-0"
              referrerPolicy="no-referrer-when-downgrade"
            />
          ) : null}
        </div>

        <div className="border-t border-[var(--border)] px-4 py-3 sm:px-5">
          <p className="text-center text-[11px] leading-relaxed text-white/45">
            If the area stays blank, the broker may block embedding — use{" "}
            <a
              href="/go"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-emerald-400/90 underline-offset-2 hover:underline"
            >
              open in a new tab
            </a>{" "}
            instead (your affiliate tracking still applies).
          </p>
        </div>
      </dialog>
    </RegisterContext.Provider>
  );
}

export function DerivRegisterButton({
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  const { open } = useDerivRegister();
  return (
    <button type="button" className={className} onClick={() => open()} {...rest}>
      {children}
    </button>
  );
}
