type BunnyEmbedProps = {
  embedUrl: string | undefined;
  title: string;
  /** Shown when embedUrl is missing (e.g. env-based setup). */
  envHint?: string;
  emptyMessage?: string;
};

export function BunnyEmbed({ embedUrl, title, envHint, emptyMessage }: BunnyEmbedProps) {
  if (!embedUrl?.trim()) {
    const hint =
      envHint !== undefined ? (
        <p className="max-w-md text-xs text-white/45">
          Add your Bunny Stream embed URL:{" "}
          <code className="text-emerald-200/90">{envHint}</code>
        </p>
      ) : emptyMessage !== undefined ? (
        <p className="max-w-md text-xs text-white/45">{emptyMessage}</p>
      ) : null;

    return (
      <div
        className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-white/20 bg-white/[0.03] px-6 text-center"
        role="region"
        aria-label={title}
      >
        <p className="text-sm font-medium text-white/80">{title}</p>
        {hint}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl shadow-black/40">
      <iframe
        src={embedUrl.trim()}
        title={title}
        className="aspect-video w-full"
        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen"
        allowFullScreen
      />
    </div>
  );
}
