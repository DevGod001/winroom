import Link from "next/link";
import type { Metadata } from "next";
import { brandTitle, siteName } from "@/lib/brand";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = {
  title: brandTitle("Contact"),
  description: `Contact ${siteName} for member support (link registrants only).`,
};

export default function ContactPage() {
  return (
    <div className="min-h-full bg-[var(--background)] px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-md">
        <h1 className="text-2xl font-bold text-white">Contact us</h1>
        <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
          <strong className="text-white/90">Member support</strong> — extra walkthroughs, funding help,
          and follow-up after the public videos — is only for people who registered with Deriv using{" "}
          <strong className="text-white/90">our link on this site</strong>. We verify against our
          referral records before spending time on deep support.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
          If you joined elsewhere, we are glad you are learning — but we cannot offer that hands-on
          lane. Questions about the website or Terms are still welcome.
        </p>

        <div className="mt-10">
          <ContactForm />
        </div>

        <p className="mt-10 text-sm text-white/45">
          <Link href="/" className="text-emerald-400/90 hover:text-emerald-300">
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
