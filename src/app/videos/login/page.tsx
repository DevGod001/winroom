import { LoginForm } from "./login-form";
import { verifyAdminSession } from "@/lib/admin-session";
import { redirect } from "next/navigation";

export default async function VideosLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const q = await searchParams;
  const next =
    typeof q.next === "string" && q.next.startsWith("/") && !q.next.startsWith("//")
      ? q.next
      : "/videos/upload";

  if (await verifyAdminSession()) {
    redirect(next);
  }

  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center px-4 py-16">
      <LoginForm redirectTo={next} />
      <p className="mt-8 max-w-md text-center text-xs text-white/40">
        If you are not the site owner, close this page. Video uploads are restricted to the
        administrator.
      </p>
    </div>
  );
}
