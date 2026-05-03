import { createHash } from "node:crypto";

export type BunnyReadyVideo = {
  guid: string;
  title: string;
  embedUrl: string;
};

type BunnyListItem = {
  guid: string;
  title?: string;
  dateUploaded: string;
  encodeProgress?: number;
  status?: number;
};

type BunnyCreateVideoResponse = {
  guid: string;
  title?: string;
  libraryId?: number;
};

function getLibraryConfig(): { libraryId: string; apiKey: string } | null {
  const libraryId = process.env.BUNNY_STREAM_LIBRARY_ID?.trim();
  const apiKey = process.env.BUNNY_STREAM_API_KEY?.trim();
  if (!libraryId || !apiKey) return null;
  return { libraryId, apiKey };
}

function isPlayable(item: BunnyListItem): boolean {
  if (item.encodeProgress === 100) return true;
  if (item.status === 4) return true;
  return false;
}

export async function listReadyVideos(): Promise<BunnyReadyVideo[]> {
  const cfg = getLibraryConfig();
  if (!cfg) return [];

  const res = await fetch(
    `https://video.bunnycdn.com/library/${cfg.libraryId}/videos?page=1&itemsPerPage=100`,
    {
      headers: { Accept: "application/json", AccessKey: cfg.apiKey },
      next: { revalidate: 60 },
    },
  );

  if (!res.ok) return [];

  const data = (await res.json()) as { items?: BunnyListItem[] };
  const items = data.items ?? [];
  const ready = items.filter(isPlayable);
  ready.sort(
    (a, b) => new Date(b.dateUploaded).getTime() - new Date(a.dateUploaded).getTime(),
  );

  return ready.map((v) => ({
    guid: v.guid,
    title: v.title?.trim() || "Untitled",
    embedUrl: `https://iframe.mediadelivery.net/embed/${cfg.libraryId}/${v.guid}`,
  }));
}

export type TusCredentials = {
  videoId: string;
  libraryId: string;
  expirationTime: number;
  signature: string;
  embedUrl: string;
};

export async function bunnyCreateVideoAndTusCredentials(
  title: string,
): Promise<{ ok: true; data: TusCredentials } | { ok: false; error: string }> {
  const cfg = getLibraryConfig();
  if (!cfg) {
    return {
      ok: false,
      error: "Bunny Stream is not configured (library ID or API key missing).",
    };
  }

  const createRes = await fetch(
    `https://video.bunnycdn.com/library/${cfg.libraryId}/videos`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        AccessKey: cfg.apiKey,
      },
      body: JSON.stringify({ title: title.trim() || "Untitled" }),
    },
  );

  if (!createRes.ok) {
    const text = await createRes.text();
    console.error("Bunny create video failed:", createRes.status, text);
    return { ok: false, error: "Could not create video in Bunny." };
  }

  const video = (await createRes.json()) as BunnyCreateVideoResponse;
  if (!video.guid) {
    return { ok: false, error: "Bunny did not return a video id." };
  }

  const expirationTime = Math.floor(Date.now() / 1000) + 86400;
  const signature = createHash("sha256")
    .update(`${cfg.libraryId}${cfg.apiKey}${expirationTime}${video.guid}`)
    .digest("hex");

  return {
    ok: true,
    data: {
      videoId: video.guid,
      libraryId: cfg.libraryId,
      expirationTime,
      signature,
      embedUrl: `https://iframe.mediadelivery.net/embed/${cfg.libraryId}/${video.guid}`,
    },
  };
}
