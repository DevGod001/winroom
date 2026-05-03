import Link from "next/link";
import { BunnyEmbed } from "@/components/bunny-embed";
import {
  DerivRegisterButton,
  DerivRegisterGate,
} from "@/components/deriv-register-gate";
import { LessonsJumpGuard } from "@/components/lessons-jump-guard";
import { listReadyVideos } from "@/lib/bunny-stream";
import { siteName, siteTagline } from "@/lib/brand";
import {
  hasVideoLibraryAccess,
  isVideoGatingConfigured,
  isVideoGatingMisconfigured,
} from "@/lib/video-member-session";

type StepCta = { href: string; label: string };

type Step = {
  n: number;
  title: string;
  body: string;
  cta?: StepCta;
  cta2?: StepCta;
};

const STEPS: Step[] = [
  {
    n: 1,
    title: "Use this link to register",
    body: "Create your Deriv account through our official link. Sign-up happens on Deriv — we never ask for your password here.",
    cta: { href: "/go", label: "Open registration" },
  },
  {
    n: 2,
    title: 'Watch the “how to trade and win” videos',
    body: "After you register, get your member code from us (we only send it to people who joined through our link). Enter it on the Unlock page — then the videos below open in this browser. In-depth help (more videos, funding your account, one-on-one-style questions) is only for that same group — contact us after we can see you in our referral list.",
    cta: { href: "/unlock?next=%2F%23lessons", label: "Unlock the library" },
    cta2: { href: "#lessons", label: "Jump to videos" },
  },
  {
    n: 3,
    title: "Practice with your $10,000 demo",
    body: "Use Deriv’s virtual balance to rehearse entries, exits, and sizing with zero pressure until you are consistent.",
  },
  {
    n: 4,
    title: "Fund your account and trade live",
    body: "When you are confident, deposit and trade your real account using the same discipline you built on demo. If you registered through our link and need a funding or account setup walkthrough, use Contact — we do not offer that hands-on support for accounts opened outside our path.",
  },
  {
    n: 5,
    title: "Take your profits and repeat",
    body: "Withdraw or compound according to your plan. Then run the playbook again — same steps, sharper execution.",
  },
];

export default async function Home() {
  const gatingOn = isVideoGatingConfigured();
  const misconfigured = isVideoGatingMisconfigured();
  const hasAccess = await hasVideoLibraryAccess();
  const showVideos = (!gatingOn || hasAccess) && !misconfigured;
  const videos = showVideos ? await listReadyVideos() : [];
  const lessonsJumpBlocked = gatingOn && !hasAccess && !misconfigured;

  return (
    <DerivRegisterGate>
    <div className="home-money-backdrop flex min-h-full min-h-svh flex-1 flex-col">
      <header className="sticky top-0 z-10 border-b border-[var(--border)] bg-[#0a0f1a]/78 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <a href="#top" className="flex flex-col leading-tight">
            <span className="text-sm font-bold tracking-tight text-white sm:text-base">
              {siteName}
            </span>
            <span className="text-[10px] text-emerald-400/85 sm:text-[11px]">{siteTagline}</span>
          </a>
          <nav className="flex items-center gap-2 sm:gap-3">
            <a
              href="#steps"
              className="hidden text-sm text-white/55 transition hover:text-white sm:inline"
            >
              Steps
            </a>
            <a
              href="#lessons"
              className="hidden text-sm text-white/55 transition hover:text-white sm:inline"
            >
              Videos
            </a>
            <Link
              href="/contact"
              className="hidden text-sm text-white/55 transition hover:text-white sm:inline"
            >
              Contact
            </Link>
            {gatingOn ? (
              <Link
                href="/unlock?next=%2F%23lessons"
                className="hidden text-sm font-semibold text-emerald-400/90 transition hover:text-emerald-300 sm:inline"
              >
                Unlock
              </Link>
            ) : null}
            <DerivRegisterButton className="rounded-full bg-emerald-400 px-3 py-2 text-xs font-bold text-emerald-950 shadow-sm transition hover:bg-emerald-300 sm:px-4 sm:text-sm">
              Register
            </DerivRegisterButton>
          </nav>
        </div>
      </header>

      <main id="top" className="flex-1">
        {misconfigured ? (
          <div className="border-b border-rose-500/30 bg-rose-500/10 px-4 py-3 text-center text-xs text-rose-200 sm:text-sm">
            Video gating is misconfigured: set <code className="rounded bg-black/30 px-1">VIDEO_GATE_SECRET</code>{" "}
            alongside your member access code.
          </div>
        ) : null}

        <section className="px-4 pb-14 pt-12 sm:px-6 sm:pt-16">
          <div className="mx-auto max-w-3xl">
            <p className="mb-4 rounded-md border border-amber-500/20 bg-amber-500/[0.07] px-3 py-2 text-[11px] leading-snug text-amber-100/90 sm:text-xs">
              For traders in <strong className="text-amber-50">Africa and permitted regions</strong>
              . <strong className="text-amber-50">Not for the U.S. or U.K.</strong> Close this page if
              that applies to you or if trading content is restricted where you are.
            </p>

            <h1 className="text-[1.65rem] font-bold leading-[1.15] tracking-tight text-white sm:text-4xl sm:leading-[1.12]">
              Earn an extra <span className="text-emerald-300">$50–$200</span> per day on Deriv trades
            </h1>
            <p className="mt-3 text-base font-medium text-white/80 sm:text-lg">
              Follow these simple steps.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-[var(--muted)]">
              {siteName} breaks it down so you can register, learn from the videos, practice,
              then trade with clarity. Daily dollar amounts are goals we highlight for motivation.
            </p>
            <p className="mt-4 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-3 text-sm leading-relaxed text-[var(--muted)]">
              <strong className="text-white/90">Hands-on support</strong> — extra training, how to fund
              your account, and follow-up beyond the public library — is{" "}
              <strong className="text-white/90">only for people who register with Deriv through our
              link on this site</strong>. We match you to our partner dashboard before spending time on
              deep help.{" "}
              <Link href="/contact" className="font-medium text-emerald-400/90 underline-offset-2 hover:underline">
                Contact us
              </Link>{" "}
              if that is you.
            </p>

            {gatingOn && !hasAccess && !misconfigured ? (
              <p className="mt-4 rounded-lg border border-emerald-500/25 bg-emerald-500/[0.08] px-3 py-2 text-sm text-emerald-100/90">
                <strong className="text-emerald-50">Videos are locked</strong> until you{" "}
                <DerivRegisterButton className="cursor-pointer bg-transparent p-0 font-semibold text-emerald-400 underline underline-offset-2 hover:text-emerald-300">
                  register with our link
                </DerivRegisterButton>{" "}
                and enter your member code on the{" "}
                <Link href="/unlock?next=%2F%23lessons" className="font-semibold underline underline-offset-2">
                  Unlock
                </Link>{" "}
                page.
              </p>
            ) : null}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <DerivRegisterButton className="inline-flex flex-1 cursor-pointer items-center justify-center rounded-xl bg-emerald-400 px-6 py-3.5 text-center text-sm font-bold text-emerald-950 transition hover:bg-emerald-300 sm:flex-none">
                Step 1 — Register with our link
              </DerivRegisterButton>
              <a
                href="#steps"
                className="inline-flex flex-1 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] px-6 py-3.5 text-center text-sm font-semibold text-white/90 transition hover:bg-white/[0.06] sm:flex-none"
              >
                View all steps
              </a>
            </div>
          </div>
        </section>

        <section
          id="steps"
          className="border-t border-[var(--border)] bg-black/20 px-4 py-14 sm:px-6"
        >
          <div className="mx-auto max-w-3xl">
            <h2 className="text-lg font-bold text-white sm:text-xl">
              The five steps
            </h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Straight to the point — do them in order.
            </p>

            <ol className="mt-10 list-none space-y-5 p-0">
              {STEPS.map((s) => (
                <li
                  key={s.n}
                  className="flex gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:gap-5 sm:p-6"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-400 text-base font-bold text-emerald-950 sm:h-11 sm:w-11">
                    {s.n}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-bold text-white sm:text-lg">{s.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{s.body}</p>
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
                      {s.cta ? (
                        s.cta.href === "/go" ? (
                          <DerivRegisterButton className="inline-flex cursor-pointer bg-transparent p-0 text-sm font-semibold text-emerald-400 hover:text-emerald-300">
                            {s.cta.label} →
                          </DerivRegisterButton>
                        ) : (
                          <a
                            href={s.cta.href}
                            className="inline-flex text-sm font-semibold text-emerald-400 hover:text-emerald-300"
                          >
                            {s.cta.label} →
                          </a>
                        )
                      ) : null}
                      {s.cta2 ? (
                        <a
                          href={s.cta2.href}
                          className="inline-flex text-sm font-semibold text-emerald-400/80 hover:text-emerald-300"
                        >
                          {s.cta2.label} →
                        </a>
                      ) : null}
                    </div>
                  </div>
                </li>
              ))}
            </ol>

            <div className="mt-10 rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.06] px-5 py-8 text-center sm:px-8">
              <p className="text-sm font-semibold text-white/90">
                Ready? Start with Step 1 — it takes only a minute.
              </p>
              <DerivRegisterButton className="mt-4 inline-flex cursor-pointer items-center justify-center rounded-xl bg-emerald-400 px-8 py-3 text-sm font-bold text-emerald-950 transition hover:bg-emerald-300">
                Register on Deriv
              </DerivRegisterButton>
            </div>
          </div>
        </section>

        <section
          id="lessons"
          className="border-t border-[var(--border)] px-4 py-14 sm:px-6"
        >
          <LessonsJumpGuard blocked={lessonsJumpBlocked} />
          <div className="mx-auto max-w-3xl">
            <h2 className="text-lg font-bold text-white sm:text-xl">
              How to trade and win — videos
            </h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Step 2: unlock with your member code, then watch here. Step 3: practice on demo.
            </p>

            {misconfigured ? (
              <div className="mt-10 rounded-2xl border border-rose-500/20 bg-rose-500/5 px-5 py-10 text-center text-sm text-rose-200/90">
                Library unavailable — site owner must set VIDEO_GATE_SECRET.
              </div>
            ) : gatingOn && !hasAccess ? (
              <div className="mt-10 rounded-2xl border border-dashed border-emerald-500/35 bg-emerald-500/[0.06] px-5 py-14 text-center">
                <p className="text-sm font-semibold text-white/90">Members only</p>
                <p className="mx-auto mt-2 max-w-sm text-sm text-[var(--muted)]">
                  Register through our link, then request your access code. We send codes only to
                  people who appear on our partner referral list.
                </p>
                <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                  <DerivRegisterButton className="inline-flex cursor-pointer rounded-xl bg-emerald-400 px-6 py-3 text-sm font-bold text-emerald-950 hover:bg-emerald-300">
                    Step 1 — Register
                  </DerivRegisterButton>
                  <Link
                    href="/unlock?next=%2F%23lessons"
                    className="inline-flex rounded-xl border border-[var(--border)] bg-[var(--surface)] px-6 py-3 text-sm font-semibold text-white/90 hover:bg-white/[0.06]"
                  >
                    I have my code
                  </Link>
                </div>
              </div>
            ) : videos.length === 0 ? (
              <div className="mt-10 rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-5 py-14 text-center">
                <p className="text-sm font-semibold text-white/85">Videos loading soon</p>
                <p className="mx-auto mt-2 max-w-sm text-sm text-[var(--muted)]">
                  Check back after registration. New lessons appear here automatically when they are
                  published.
                </p>
              </div>
            ) : (
              <div className="mt-10 space-y-10">
                {videos.map((v) => (
                  <div key={v.guid}>
                    <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-white/45">
                      {v.title}
                    </h3>
                    <BunnyEmbed embedUrl={v.embedUrl} title={v.title} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section
          id="support"
          className="border-t border-[var(--border)] bg-black/25 px-4 py-14 sm:px-6"
        >
          <div className="mx-auto max-w-3xl">
            <h2 className="text-lg font-bold text-white sm:text-xl">Who we help one-on-one</h2>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
              Our small team prioritizes <strong className="text-white/85">members who joined Deriv
              using the registration links we publish here</strong>. That is how we know you are part
              of the community this site is built for. If you signed up through a different path, you
              can still use the public steps and videos where available — but we cannot extend the
              same personalized support (funding walkthroughs, extra video depth, account troubleshooting).
            </p>
            <p className="mt-4 text-sm leading-relaxed text-[var(--muted)]">
              Ready to reach out and you used our link?{" "}
              <Link
                href="/contact"
                className="font-semibold text-emerald-400/90 underline-offset-2 hover:underline"
              >
                Go to Contact
              </Link>
              . Include the email or details we can use to confirm your referral when relevant.
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--border)] px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <p className="text-xs leading-relaxed text-white/45">
            Trading involves risk of loss. Figures like $50–$200 per day are not promises or averages
            for everyone.{" "}
            <Link href="/terms" className="text-emerald-400/90 hover:text-emerald-300">
              See Terms for the full disclaimer
            </Link>{" "}
            (including the earnings disclaimer) before you trade.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 border-t border-[var(--border)] pt-6 text-xs text-white/40 sm:justify-between">
            <span className="font-semibold text-white/60">{siteName}</span>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
              <Link href="/contact" className="text-emerald-400/90 hover:text-emerald-300">
                Contact
              </Link>
              <Link href="/terms" className="text-emerald-400/90 hover:text-emerald-300">
                Terms
              </Link>
            </div>
            <span>© {new Date().getFullYear()}</span>
          </div>
        </div>
      </footer>
    </div>
    </DerivRegisterGate>
  );
}
