"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

type TusCredentials = {
  videoId: string;
  libraryId: string;
  expirationTime: number;
  signature: string;
  embedUrl: string;
};

export function UploadClient() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastEmbed, setLastEmbed] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/videos/login");
    router.refresh();
  }, [router]);

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setError(null);
    if (f && !title.trim()) {
      setTitle(f.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const runUpload = async () => {
    if (!file) {
      setError("Choose a video file.");
      return;
    }
    setError(null);
    setBusy(true);
    setProgress(0);
    setStatus("Creating upload…");

    const initRes = await fetch("/api/videos/init-upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim() || file.name }),
    });

    if (initRes.status === 401) {
      setBusy(false);
      setStatus(null);
      setProgress(null);
      router.push("/videos/login?next=/videos/upload");
      return;
    }

    if (!initRes.ok) {
      const err = (await initRes.json()) as { error?: string };
      setError(err.error ?? "Could not start upload.");
      setBusy(false);
      setStatus(null);
      setProgress(null);
      return;
    }

    const cred = (await initRes.json()) as TusCredentials;
    setLastEmbed(cred.embedUrl);
    setStatus("Uploading to Bunny…");

    const tus = await import("tus-js-client");

    try {
      await new Promise<void>((resolve, reject) => {
        const upload = new tus.Upload(file, {
          endpoint: "https://video.bunnycdn.com/tusupload",
          retryDelays: [0, 3000, 5000, 10000, 20000, 60000],
          headers: {
            AuthorizationSignature: cred.signature,
            AuthorizationExpire: String(cred.expirationTime),
            VideoId: cred.videoId,
            LibraryId: cred.libraryId,
          },
          metadata: {
            filetype: file.type || "video/mp4",
            title: title.trim() || file.name,
          },
          onError: (err) => {
            reject(err);
          },
          onProgress: (bytesUploaded, bytesTotal) => {
            if (bytesTotal > 0) {
              setProgress(Math.round((bytesUploaded / bytesTotal) * 100));
            }
          },
          onSuccess: () => {
            resolve();
          },
        });

        void upload.findPreviousUploads().then((previous) => {
          if (previous.length) {
            upload.resumeFromPreviousUpload(previous[0]);
          }
          upload.start();
        });
      });

      setProgress(100);
      setStatus("Upload complete. Bunny may take a minute to finish encoding.");
      router.refresh();
    } catch (err: unknown) {
      const msg =
        err instanceof Error && err.message ? err.message : "Upload failed.";
      setError(msg);
      setStatus(null);
      setProgress(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-12 sm:px-6">
      <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Upload video</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Files upload directly to Bunny Stream (TUS). Your API key never leaves the server.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void logout()}
          className="shrink-0 rounded-xl border border-[var(--border)] px-4 py-2 text-sm text-white/70 transition hover:bg-white/5"
        >
          Sign out
        </button>
      </div>

      <div className="flex flex-col gap-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8">
        <div className="flex flex-col gap-2">
          <label htmlFor="video-title" className="text-sm font-medium text-white/80">
            Title
          </label>
          <input
            id="video-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="rounded-xl border border-[var(--border)] bg-black/40 px-4 py-3 text-white placeholder:text-white/35 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
            placeholder="Lesson name"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="video-file" className="text-sm font-medium text-white/80">
            Video file
          </label>
          <input
            id="video-file"
            type="file"
            accept="video/*"
            onChange={onFile}
            className="text-sm text-white/80 file:mr-4 file:rounded-lg file:border-0 file:bg-emerald-400 file:px-4 file:py-2 file:text-sm file:font-medium file:text-emerald-950 hover:file:bg-emerald-300"
          />
        </div>

        {error ? (
          <p className="text-sm text-rose-400" role="alert">
            {error}
          </p>
        ) : null}

        {progress !== null ? (
          <div className="space-y-2">
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-emerald-400 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-white/50">{progress}%</p>
          </div>
        ) : null}

        {status ? <p className="text-sm text-emerald-200/90">{status}</p> : null}

        <button
          type="button"
          onClick={() => void runUpload()}
          disabled={busy || !file}
          className="rounded-xl bg-emerald-400 py-3 font-semibold text-emerald-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-45"
        >
          {busy ? "Working…" : "Upload to Bunny"}
        </button>
      </div>

      {lastEmbed ? (
        <div className="mt-10">
          <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-white/50">
            Preview (when encoding finishes)
          </h2>
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-black">
            <iframe
              src={lastEmbed}
              title="Uploaded video preview"
              className="aspect-video w-full"
              allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
            />
          </div>
          <p className="mt-3 text-xs text-white/45">
            New uploads appear on the homepage after Bunny finishes processing (often within a few
            minutes). Refresh the home page to see them in the Video lessons section.
          </p>
        </div>
      ) : null}
    </div>
  );
}
