import { redirect } from "next/navigation";
import { verifyAdminSession } from "@/lib/admin-session";
import { UploadClient } from "./upload-client";

export default async function VideosUploadPage() {
  if (!(await verifyAdminSession())) {
    redirect("/videos/login?next=/videos/upload");
  }
  return <UploadClient />;
}
