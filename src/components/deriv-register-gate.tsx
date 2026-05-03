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

/** Extra dwell after iframe `load` — keep short so the hang-tight state does not outstay Deriv. */
const IFRAME_LOADER_MIN_MS = 220;

/** Prefetched signup URL stays valid for this long (affiliate query rarely changes). */
const AFFILIATE_URL_TTL_MS = 10 * 60 * 1000;

/** If iframe `load` never fires (iOS quirks / slow redirects), hide overlay after this once URL is set. */
const IFRAME_LOAD_FAILSAFE_DESKTOP_MS = 6000;
const IFRAME_LOAD_FAILSAFE_MOBILE_MS = 2400;

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

async function requestElementFullscreen(el: HTMLElement): Promise<void> {
  const req =
    el.requestFullscreen?.bind(el) ??
    (
      el as HTMLElement & {
        webkitRequestFullscreen?: () => Promise<void>;
      }
    ).webkitRequestFullscreen?.bind(el) ??
    (
      el as HTMLElement & {
        mozRequestFullScreen?: () => Promise<void>;
      }
    ).mozRequestFullScreen?.bind(el);
  if (req) await req();
}

function RegisterLoaderOverlay({ visible }: { visible: boolean }) {
  return (
    <div
      className={`absolute inset-0 z-10 flex flex-col items-center justify-center gap-6 bg-gradient-to-b from-[#0d1a14]/95 via-[var(--background)]/96 to-[#0a0f1a]/97 px-6 transition-opacity duration-200 motion-reduce:transition-none ${
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

function isCoarseOrNarrowViewport(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(pointer: coarse)").matches ||
    window.matchMedia("(max-width: 767px)").matches
  );
}

/** iOS / most phones: Fullscreen API does not apply to a div; our button would fail silently. */
function canUseElementFullscreen(): boolean {
  if (typeof document === "undefined") return false;
  if (isCoarseOrNarrowViewport()) return false;
  const p =
    typeof document.createElement("div").requestFullscreen === "function";
  return p;
}

type PrefetchedAffiliate = { url: string; fetchedAt: number };

export function DerivRegisterGate({ children }: { children: ReactNode }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const iframeStageRef = useRef<HTMLDivElement>(null);
  const iframeLoadStartedAt = useRef(0);
  const iframeFirstLoadHandled = useRef(false);
  const hideLoaderTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoBrowserFsTried = useRef(false);
  const prefetchedAffiliateRef = useRef<PrefetchedAffiliate | null>(null);
  const [openGeneration, setOpenGeneration] = useState(0);
  const [frameUrl, setFrameUrl] = useState<string | null>(null);
  const [loadState, setLoadState] = useState<"idle" | "loading" | "ready" | "error">(
    "idle",
  );
  const [iframeLoaderDone, setIframeLoaderDone] = useState(true);
  const [isIframeFullscreen, setIsIframeFullscreen] = useState(false);
  /** Client-only — avoids SSR vs desktop hydration mismatch for Full screen controls. */
  const [desktopFullscreenOffered, setDesktopFullscreenOffered] = useState(false);

  const clearHideTimer = useCallback(() => {
    if (hideLoaderTimer.current) {
      clearTimeout(hideLoaderTimer.current);
      hideLoaderTimer.current = null;
    }
  }, []);

  const resetContent = useCallback(() => {
    clearHideTimer();
    void exitFullscreenIfAny();
    iframeFirstLoadHandled.current = false;
    autoBrowserFsTried.current = false;
    setFrameUrl(null);
    setLoadState("idle");
    setIframeLoaderDone(true);
    setIsIframeFullscreen(false);
  }, [clearHideTimer]);

  useEffect(() => {
    setDesktopFullscreenOffered(canUseElementFullscreen());
  }, []);

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

  /** Warm affiliate URL in the background so Register does not wait on cold /api on first tap. */
  useEffect(() => {
    let cancelled = false;
    fetch("/api/deriv/affiliate-url", { credentials: "same-origin" })
      .then(async (r) => {
        if (!r.ok || cancelled) return;
        const data = (await r.json()) as { url?: string };
        if (!data.url || cancelled) return;
        prefetchedAffiliateRef.current = { url: data.url, fetchedAt: Date.now() };
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (openGeneration === 0) return;

    let cancelled = false;
    iframeFirstLoadHandled.current = false;
    setIframeLoaderDone(false);

    const cached = prefetchedAffiliateRef.current;
    const cacheAge = cached ? Date.now() - cached.fetchedAt : Infinity;
    if (cached && cacheAge < AFFILIATE_URL_TTL_MS) {
      iframeLoadStartedAt.current = Date.now();
      setFrameUrl(cached.url);
      setLoadState("ready");
    } else {
      setLoadState("loading");
      setFrameUrl(null);
    }

    if (cached && cacheAge < AFFILIATE_URL_TTL_MS) {
      fetch("/api/deriv/affiliate-url", { credentials: "same-origin" })
        .then(async (r) => {
          if (!r.ok || cancelled) return;
          const data = (await r.json()) as { url?: string };
          if (cancelled || !data.url) return;
          prefetchedAffiliateRef.current = { url: data.url, fetchedAt: Date.now() };
        })
        .catch(() => {});
      return () => {
        cancelled = true;
      };
    }

    fetch("/api/deriv/affiliate-url", { credentials: "same-origin" })
      .then(async (r) => {
        if (!r.ok) throw new Error("affiliate url unavailable");
        const data = (await r.json()) as { url?: string };
        if (cancelled || !data.url) return;
        prefetchedAffiliateRef.current = { url: data.url, fetchedAt: Date.now() };
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
    const ms = isCoarseOrNarrowViewport()
      ? IFRAME_LOAD_FAILSAFE_MOBILE_MS
      : IFRAME_LOAD_FAILSAFE_DESKTOP_MS;
    const failSafe = window.setTimeout(() => {
      setIframeLoaderDone(true);
    }, ms);
    return () => clearTimeout(failSafe);
  }, [frameUrl, loadState]);

  const finishIframeLoader = useCallback(() => {
    if (iframeFirstLoadHandled.current) return;
    iframeFirstLoadHandled.current = true;
    if (!iframeLoadStartedAt.current) {
      iframeLoadStartedAt.current = Date.now();
    }

    const elapsed = Date.now() - iframeLoadStartedAt.current;
    const wait = Math.max(0, IFRAME_LOADER_MIN_MS - elapsed);
    clearHideTimer();
    hideLoaderTimer.current = setTimeout(() => {
      setIframeLoaderDone(true);
      hideLoaderTimer.current = null;
    }, wait);
  }, [clearHideTimer]);

  useEffect(() => () => clearHideTimer(), [clearHideTimer]);

  /** Browser fullscreen API (desktop only): optional extra chrome hiding. */
  useEffect(() => {
    if (!iframeLoaderDone || !frameUrl || loadState !== "ready") return;
    if (autoBrowserFsTried.current) return;
    if (!canUseElementFullscreen()) return;

    autoBrowserFsTried.current = true;
    const stage = iframeStageRef.current;
    if (!stage || getFullscreenElement()) return;

    const t = window.setTimeout(() => {
      void requestElementFullscreen(stage).catch(() => {
        /* gesture / policy — user can tap Full screen */
      });
    }, 400);
    return () => clearTimeout(t);
  }, [iframeLoaderDone, frameUrl, loadState]);

  const toggleIframeFullscreen = useCallback(async () => {
    const el = iframeStageRef.current;
    if (!el || !frameUrl) return;
    const fsEl = getFullscreenElement();
    try {
      if (fsEl === el) {
        await exitFullscreenIfAny();
        return;
      }
      await requestElementFullscreen(el);
    } catch {
      /* Safari / privacy mode may block */
    }
  }, [frameUrl]);

  const open = useCallback(() => {
    resetContent();
    setOpenGeneration((g) => g + 1);
    dialogRef.current?.showModal();
  }, [resetContent]);

  const showLoaderOverlay =
    loadState === "loading" ||
    (loadState === "ready" && Boolean(frameUrl) && !iframeLoaderDone);

  const showFullscreenChrome =
    Boolean(frameUrl) &&
    loadState === "ready" &&
    !showLoaderOverlay &&
    desktopFullscreenOffered;

  return (
    <RegisterContext.Provider value={{ open }}>
      {children}
      <dialog
        ref={dialogRef}
        className="deriv-register-dialog fixed inset-0 z-[100] m-0 flex h-[100dvh] max-h-[100dvh] w-full flex-col overflow-hidden rounded-none border-0 bg-[var(--background)] p-0 text-[var(--foreground)] shadow-2xl"
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[var(--border)] px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-5 sm:pt-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white">Register on Deriv</p>
            <p className="mt-0.5 text-xs text-[var(--muted)]">
              {desktopFullscreenOffered ? (
                <>
                  Use{" "}
                  <span className="text-white/70">Full screen</span> below to hide browser chrome
                  on desktop. Next steps inside Deriv may take a moment.
                </>
              ) : (
                <>
                  This sheet uses the full screen on phones — mobile browsers don&apos;t allow true
                  fullscreen for embedded pages. Next steps inside Deriv may take a moment.
                </>
              )}
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

        <div className="relative flex min-h-0 flex-1 flex-col bg-black/50">
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
              className="deriv-iframe-stage relative min-h-0 flex-1 bg-black/30"
            >
              <iframe
                title="Deriv registration"
                src={frameUrl}
                className="deriv-iframe-el h-full w-full border-0"
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

        <div className="shrink-0 border-t border-[var(--border)] px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 sm:px-5 sm:pb-3">
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
            instead (your affiliate tracking still applies). After you tap buttons inside Deriv,
            the next screen is controlled by them — short waits there are normal.
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
