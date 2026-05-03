"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

const LESSONS_HASH = "#lessons";
const UNLOCK_PATH = "/unlock";

function hashSaysLessons(): boolean {
  if (typeof window === "undefined") return false;
  const h = window.location.hash;
  return h === LESSONS_HASH || h.startsWith(`${LESSONS_HASH}/`) || h.startsWith(`${LESSONS_HASH}?`);
}

/**
 * When video library is gated and the user is not unlocked, sending them to #lessons
 * (direct link or in-page jump) redirects to /unlock so they cannot skim the section without a code.
 */
export function LessonsJumpGuard({ blocked }: { blocked: boolean }) {
  const router = useRouter();

  useEffect(() => {
    if (!blocked) return;

    const go = () => {
      if (!hashSaysLessons()) return;
      const next = encodeURIComponent(`/${LESSONS_HASH}`);
      router.replace(`${UNLOCK_PATH}?next=${next}`);
    };

    go();
    window.addEventListener("hashchange", go);
    return () => window.removeEventListener("hashchange", go);
  }, [blocked, router]);

  return null;
}
