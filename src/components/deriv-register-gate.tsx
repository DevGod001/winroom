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

const IFRAME_LOADER_MIN_MS = 1200;

type RegisterContextValue = { open: () => void };

const RegisterContext = createContext<RegisterContextValue | null>(null);

export function useDerivRegister(): RegisterContextValue {
  const c = useContext(RegisterContext);
  if (!c) {
    throw new Error("useDerivRegister must be used within DerivRegisterGate");
  }
  return c;
}

function getFullscreenElement(): Element | null {
  const doc = document as Document & {
    webkitFullscreenElement?: Element | null;
    mozFullScreenElement?: Element | null;
  };
  return (
    document.fullscreenElement ??
    doc.webkitFullscreenElement ??
    doc.mozFullScreenElement ??
    null
  );
}

async function exitFullscreenIfAny(): Promise<void> {
  if (!getFullscreenElement()) return;
  const doc = document as Document & {
    webkitExitFullscreen?: () => Promise<void>;
    mozCancelFullScreen?: () => Promise<void>;
  };
  try {
    if (document.exitFullscreen) await document.exitFullscreen();
    else if (doc.webkitExitFullscreen) await doc.webkitExitFullscreen();
    else if (doc.mozCancelFullScreen) await doc.mozCancelFullScreen();
  } catch {
    /* ignore */
  }
}

function RegisterLoaderOverlay({ visible }: { visible: boolean }) {
  return (
    <div
      className={`absolute inset-0 z-10 flex flex-col items-center justify-center gap-6 bg-gradient-to-b from-[#0d1a14]/95 via-[var(--background)]/96 to-[#0a0f1a]/97 px-6 transition-opacity duration-500 motion-reduce:transition-none ${
        visible ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
      aria-hidden={!visible}
    >
      <div className="relative flex h-24 w-24 items-center justify-center">
        <div
          className="deriv-reg-loader-orbit-outer absolute inset-0 rounded-full border-2 border-emerald-400/20 border-t-emerald-400/70"
          aria-hidden
        />
        <div
          className="deriv-reg-loader-orbit absolute inset-2 rounded-full border-2 border-transparent border-t-emerald-400 border-r-emerald-400/35"
          aria-hidden
        />
        <div
          className="absolute inset-0 rounded-full bg-emerald-400/10 motion-safe:animate-pulse motion-reduce:animate-none"
          style={{ animationDuration: "2.2s" }}
          aria-hidden
        />
      </div>
      <div className="max-w-xs text-center">
        <p className="text-base font-semibold text-white">Hang tight</p>
        <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
          We&apos;re opening secure sign-up for you. This usually takes just a moment.
        </p>
      </div>
      <p className="text-[11px] tracking-wide text-white/35">Connecting…</p>
    </div>
  );
}

export function DerivRegisterGate({ children }: { children: ReactNode }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const iframeStageRef = useRef<HTMLDivElement>(null);
  const iframeLoadStartedAt = useRef(0);
  const hideLoaderTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [openGeneration, setOpenGeneration] = useState(0);
  const [frameUrl, setFrameUrl] = useState<string | null>(null);
  const [loadState, setLoadState] = useState<"idle" | "loading" | "ready" | "error">(
    "idle",
  );
  const [iframeLoaderDone, setIframeLoaderDone] = useState(true);
  const [isIframeFullscreen, setIsIframeFullscreen] = useState(false);

  const clearHideTimer = useCallback(() => {
    if (hideLoaderTimer.current) {
      clearTimeout(hideLoaderTimer.current);
      hideLoaderTimer.current = null;
    }
  }, []);

  const resetContent = useCallback(() => {
    clearHideTimer();
    void exitFullscreenIfAny();
    setFrameUrl(null);
    setLoadState("idle");
    setIframeLoaderDone(true);
    setIsIframeFullscreen(false);
  }, [clearHideTimer]);

  useEffect(() => {
    const onFsChange = () => {
      setIsIframeFullscreen(getFullscreenElement() === iframeStageRef.current);
    };
    document.addEventListener("fullscreenchange", onFsChange);
    document.addEventListener("webkitfullscreenchange", onFsChange as EventListener);
    return () => {
      document.removeEventListener("fullscreenchange", onFsChange);
      document.removeEventListener(
        "webkitfullscreenchange",
        onFsChange as EventListener,
      );
    };
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
    setIframeLoaderDone(false);

    fetch("/api/deriv/affiliate-url", { credentials: "same-origin" })
      .then(async (r) => {
        if (!r.ok) throw new Error("affiliate url unavailable");
        const data = (await r.json()) as { url?: string };
        if (cancelled || !data.url) return;
        iframeLoadStartedAt.current = Date.now();
        setFrameUrl(data.url);
        setLoadState("ready");
      })
      .catch(() => {
        if (!cancelled) {
          setLoadState("error");
          setIframeLoaderDone(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [openGeneration]);

  useEffect(() => {
    if (!frameUrl || loadState !== "ready") return;
    const failSafe = window.setTimeout(() => {
      setIframeLoaderDone(true);
    }, 15_000);
    return () => clearTimeout(failSafe);
  }, [frameUrl, loadState]);

  const finishIframeLoader = useCallback(() => {
    const elapsed = Date.now() - iframeLoadStartedAt.current;
    const wait = Math.max(0, IFRAME_LOADER_MIN_MS - elapsed);
    clearHideTimer();
    hideLoaderTimer.current = setTimeout(() => {
      setIframeLoaderDone(true);
      hideLoaderTimer.current = null;
    }, wait);
  }, [clearHideTimer]);

  useEffect(() => () => clearHideTimer(), [clearHideTimer]);

  const toggleIframeFullscreen = useCallback(async () => {
    const el = iframeStageRef.current;
    if (!el || !frameUrl) return;
    const fsEl = getFullscreenElement();
    try {
      if (fsEl === el) {
        await exitFullscreenIfAny();
        return;
      }
      const req =
        el.requestFullscreen?.bind(el) ??
        (el as HTMLElement & { webkitRequestFullscreen?: () => Promise<void> })
          .webkitRequestFullscreen?.bind(el) ??
        (el as HTMLElement & { mozRequestFullScreen?: () => Promise<void> })
          .mozRequestFullScreen?.bind(el);
      if (req) await req();
    } catch {
      /* Safari / privacy mode may block */
    }
  }, [frameUrl]);

  const open = useCallback(() => {
    resetContent();
    setLoadState("loading");
    setOpenGeneration((g) => g + 1);
    dialogRef.current?.showModal();
  }, [resetContent]);

  const showLoaderOverlay =
    loadState === "loading" ||
    (loadState === "ready" && Boolean(frameUrl) && !iframeLoaderDone);

  const showFullscreenChrome =
    Boolean(frameUrl) && loadState === "ready" && !showLoaderOverlay;

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
              Complete sign-up below. Use full screen for more room — this page stays open behind
              it.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            {showFullscreenChrome ? (
              <button
                type="button"
                onClick={() => void toggleIframeFullscreen()}
                className="rounded-lg px-2 py-1.5 text-xs font-semibold text-emerald-400/95 transition hover:bg-white/10 hover:text-emerald-300 sm:px-3 sm:text-sm"
              >
                {isIframeFullscreen ? "Exit full screen" : "Full screen"}
              </button>
            ) : null}
            <button
              type="button"
              className="rounded-lg px-2 py-1 text-sm text-white/60 transition hover:bg-white/10 hover:text-white"
              onClick={() => dialogRef.current?.close()}
              aria-label="Close registration"
            >
              ×
            </button>
          </div>
        </div>

        <div className="relative min-h-[min(70vh,640px)] flex-1 bg-black/50">
          <RegisterLoaderOverlay visible={showLoaderOverlay} />
          {loadState === "error" ? (
            <div className="absolute inset-0 z-[5] flex flex-col items-center justify-center gap-4 bg-[var(--background)] p-6 text-center">
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
            <div
              ref={iframeStageRef}
              className="deriv-iframe-stage relative h-full min-h-[min(70vh,640px)] w-full"
            >
              <iframe
                title="Deriv registration"
                src={frameUrl}
                className="deriv-iframe-el h-full min-h-[min(70vh,640px)] w-full border-0"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
                allow="fullscreen"
                onLoad={finishIframeLoader}
              />
              {showFullscreenChrome ? (
                <button
                  type="button"
                  onClick={() => void toggleIframeFullscreen()}
                  className="absolute bottom-3 right-3 z-[6] rounded-lg border border-white/15 bg-[#0a0f1a]/90 px-3 py-2 text-xs font-semibold text-emerald-300 shadow-lg backdrop-blur-sm transition hover:border-emerald-400/40 hover:bg-[#0a0f1a] hover:text-emerald-200 sm:text-sm"
                >
                  {isIframeFullscreen ? "Exit full screen" : "Full screen"}
                </button>
              ) : null}
            </div>
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
