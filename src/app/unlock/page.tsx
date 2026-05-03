import { requireAffiliateClickBeforeUnlock } from "@/lib/video-member-session";
import { UnlockForm } from "./unlock-form";

function safeRedirectAfter(raw: string | undefined): string {
  if (!raw || typeof raw !== "string") return "/#lessons";
  const t = raw.trim();
  if (!t.startsWith("/") || t.startsWith("//")) return "/#lessons";
  return t;
}

export default async function UnlockPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const q = await searchParams;
  const redirectAfter = safeRedirectAfter(q.next);

  return (
    <div className="min-h-full bg-[var(--background)]">
      <UnlockForm
        showAffiliateNote={requireAffiliateClickBeforeUnlock()}
        redirectAfter={redirectAfter}
      />
    </div>
  );
}
