import Link from "next/link";
import { brandTitle, siteName } from "@/lib/brand";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: brandTitle("Terms of Service"),
  description: `Terms of Service for ${siteName}.`,
};

export default function TermsPage() {
  return (
    <div className="min-h-full bg-[var(--background)] px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <p className="text-xs font-medium uppercase tracking-wider text-emerald-400/90">
          Legal
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Terms of Service
        </h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Last updated: April 30, 2026 · {siteName}
        </p>

        <div className="mt-12 max-w-none space-y-10 text-sm leading-relaxed text-[var(--muted)]">
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">1. Who we speak to</h2>
            <p>
              {siteName} packages motivational trading media — bold language included — for people
              in <strong className="text-white/90">Africa, emerging markets,</strong> and other areas
              where our partner broker accepts clients and our style of promotion is appropriate.
              This site is <strong className="text-white/90">not directed at residents of the United
              States or the United Kingdom</strong>, or at anyone in a jurisdiction where accessing
              the content or the linked broker would be unlawful. If that restriction applies to
              you, do not use {siteName}.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">2. The service</h2>
            <p>
              We publish video and text meant to energize, educate, and showcase trading ideas and
              workflows. We are{" "}
              <strong className="text-white/90">not</strong> your broker, fund manager, or
              personalized adviser unless we say otherwise in writing and are licensed where you
              live.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">3. Your decisions</h2>
            <p>
              You choose whether and how to trade. Past clips, examples, or hype moments on this site
              do not guarantee future performance. You are responsible for taxes, compliance, and
              sizing in your country.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">4. Earnings disclaimer</h2>
            <p>
              Any dollar amounts, daily ranges (for example $50–$200 per day), or success language on
              this website are <strong className="text-white/90">illustrative and motivational</strong>
              . They are <strong className="text-white/90">not</strong> a guarantee, forecast, or
              typical result for any user. Trading profits depend on skill, risk management, market
              conditions, capital, fees, and other factors outside {siteName}&apos;s control. You may
              earn less, more, or nothing at all; you may also lose money, including when using
              leverage. Do not treat website copy as a promise of performance.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">5. Registration &amp; third parties</h2>
            <p>
              Some experiences assume you open an account through links we operate. The trading
              platform sets its own eligibility, fees, and rules in your region — read theirs before
              you fund or trade.
            </p>
            <p className="mt-3">
              <strong className="text-white/90">Video library:</strong> access may require a member
              code issued by {siteName}. We aim to restrict codes to people we believe registered
              through our affiliate link (for example after we see them in our partner dashboard).
              Deriv does not automatically notify this website when you sign up, so verification can
              be manual. Do not share your code publicly.
            </p>
            <p className="mt-3">
              <strong className="text-white/90">Hands-on support:</strong> personalized help beyond
              public materials — for example deeper video topics, how to fund your account, or
              platform walkthroughs — is offered{" "}
              <strong className="text-white/90">only to users we can tie to our official
              registration links</strong>. If you opened your account outside that path, we may
              decline or limit that type of assistance.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">
              6. Affiliate relationships &amp; compensation
            </h2>
            <p>
              {siteName} may earn fees, commissions, rebates, or other compensation when you create
              accounts, deposit, or trade through links, codes, or promotional paths we operate.
              That compensation may be paid by third-party providers and does not necessarily
              increase the price you pay to them.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">7. Member support eligibility</h2>
            <p>
              {siteName} is operated with limited capacity. We reserve the right to prioritize or
              restrict <strong className="text-white/90">one-on-one or extended support</strong>{" "}
              (including email or chat help, custom explanations, and funding or account
              onboarding assistance) to individuals we reasonably believe registered with our
              partner broker through links, codes, or flows published on this website and confirmed
              in our partner tools where applicable. This policy exists so our time goes to the
              audience the site is designed to serve. It is not a refusal to honor these Terms for
              other visitors — it is a scope limit on discretionary support services.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">8. Intellectual property</h2>
            <p>
              Unless otherwise noted, videos, text, layout, and graphics on this site belong to{" "}
              {siteName} or our licensors. You may not scrape, redistribute, or commercially reuse
              our content without written permission.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">9. Disclaimers &amp; liability</h2>
            <p>
              The service is provided &ldquo;as is&rdquo; without warranties of any kind. To the
              fullest extent permitted by law where you access {siteName}, we are not liable for
              trading losses, missed opportunities, or decisions you make after viewing our
              materials. Leveraged products can produce losses beyond your deposit — trade only with
              capital you can afford to lose.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">10. Changes</h2>
            <p>
              We may update these terms by posting a new version on this page. Continued use after
              changes means you accept the update unless local law says otherwise.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">11. Contact</h2>
            <p>
              For questions about these Terms or the website, or for member inquiries when you
              joined through our published registration links, you may use the{" "}
              <Link href="/contact" className="font-medium text-emerald-400/90 hover:text-emerald-300">
                Contact
              </Link>{" "}
              page or write directly to{" "}
              <a
                href="mailto:winroomderiv@gmail.com"
                className="font-medium text-emerald-400/90 hover:text-emerald-300"
              >
                winroomderiv@gmail.com
              </a>
              . We do not guarantee a reply timeframe. Email delivery depends on your provider and
              ours; check spam folders.
            </p>
          </section>
        </div>

        <p className="mt-14 text-sm text-white/45">
          <Link href="/" className="text-emerald-400/90 hover:text-emerald-300">
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
