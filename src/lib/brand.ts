/**
 * Public brand strings. Override with NEXT_PUBLIC_SITE_NAME / NEXT_PUBLIC_SITE_TAGLINE in .env
 */
export const siteName =
  process.env.NEXT_PUBLIC_SITE_NAME?.trim() || "Win Room";

export const siteTagline =
  process.env.NEXT_PUBLIC_SITE_TAGLINE?.trim() ||
  "Simple steps · Deriv · Member videos";

export const siteDescription =
  "Earn extra income on Deriv trades: register, watch how-to-win videos, practice on a $10,000 demo, go live when ready. See Terms for earnings disclaimers.";

export function brandTitle(page?: string): string {
  if (page) return `${page} · ${siteName}`;
  return siteName;
}
