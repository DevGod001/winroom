# Deriv affiliate landing (Next.js)

A small, compliance-minded marketing site: hero, three-step path, Bunny Stream lessons on the homepage, a server redirect for your Deriv affiliate URL, and an **admin-only** upload area that sends videos to Bunny via **TUS** (browser uploads directly to Bunny; API key stays on the server).

## Environment variables

Copy [.env.example](.env.example) to `.env.local` for local development (never commit real secrets).

| Variable | Required | Where |
| -------- | -------- | ----- |
| `DERIV_AFFILIATE_URL` | **Yes** (for `/go`) | Full `https://...` affiliate / tracker URL. Server-only. |
| `ADMIN_PASSWORD` | **Yes** (for `/videos/upload`) | Password you type on `/videos/login`. Use a long random value. |
| `ADMIN_SESSION_SECRET` | **Yes** (for `/videos/upload`) | Secret used to sign the admin session cookie (long random string). |
| `BUNNY_STREAM_LIBRARY_ID` | **Yes** (for lessons + upload) | Stream **Video library ID** (Bunny dashboard → Stream → your library). |
| `BUNNY_STREAM_API_KEY` | **Yes** (for lessons + upload) | Stream **API key** for that library (not your global account API key unless that is what Bunny shows for the library). Server-only. |
| `VIDEO_GATE_SECRET` | For **gated** videos | Long random string; signs member + affiliate-click cookies. |
| `MEMBER_ACCESS_CODE` | For **gated** videos | Passphrase (or comma-list in one var) users enter on `/unlock`. Omit both code **and** secret to leave the library **public** (dev default). |
| `REQUIRE_AFFILIATE_CLICK_BEFORE_UNLOCK` | No | `true` = user must open `/go` in the **same browser** before the code works. Default **false** (code only; you still distribute codes to confirmed referrals). |

CTA buttons use **`/go`**, which **302** redirects to `DERIV_AFFILIATE_URL` and optionally drops an **affiliate-click** cookie when `VIDEO_GATE_SECRET` is set. If `DERIV_AFFILIATE_URL` is missing or invalid, `/go` returns **503**.

### Member-only video library

Deriv does **not** send this app a webhook when someone registers. Realistic gating is:

1. **`MEMBER_ACCESS_CODE` + `VIDEO_GATE_SECRET`** — you send the code only to people you see in your affiliate/IB dashboard.
2. Optional **`REQUIRE_AFFILIATE_CLICK_BEFORE_UNLOCK=true`** — also requires this browser to have hit `/go` first (stronger tie to your link; awkward if they register on another device).

Without both `MEMBER_ACCESS_CODE` and `VIDEO_GATE_SECRET`, the homepage **shows videos to everyone** (useful for local testing).

### Admin upload flow

1. Set `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`, `BUNNY_STREAM_LIBRARY_ID`, and `BUNNY_STREAM_API_KEY` in `.env.local` (and in Vercel).
2. Open **`/videos/login`**, sign in, then you are redirected to **`/videos/upload`**.
3. Choose a title and file; the app creates a Bunny video object, returns **presigned TUS headers**, and the browser uploads to `https://video.bunnycdn.com/tusupload` ([Bunny TUS docs](https://docs.bunny.net/reference/tus-resumable-uploads)).
4. After Bunny finishes encoding, videos appear on the homepage **Video lessons** section (list is refreshed periodically via `revalidate: 60`).

Anyone can **visit** `/videos/login`, but only the correct password establishes a session. Upload APIs require that session cookie.

## Local development

```bash
npm install
cp .env.example .env.local
# Edit .env.local — all variables in .env.example for full functionality
npm run dev
```

- Site: [http://localhost:3000](http://localhost:3000)
- Redirect test: [http://localhost:3000/go](http://localhost:3000/go)
- Member unlock: [http://localhost:3000/unlock](http://localhost:3000/unlock)
- Admin: [http://localhost:3000/videos/login](http://localhost:3000/videos/login)

## Deploy on Vercel

1. Import the repo; framework **Next.js**.
2. Add **Environment Variables** for Production (and Preview if needed):  
   `DERIV_AFFILIATE_URL`, optional `VIDEO_GATE_SECRET` + `MEMBER_ACCESS_CODE` for gated lessons,  
   `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`, `BUNNY_STREAM_LIBRARY_ID`, `BUNNY_STREAM_API_KEY`.
3. Deploy.

No `NEXT_PUBLIC_` Bunny keys are required: embed URLs are built on the server from the library ID and each video GUID.

## Compliance and copy

Copy is framed around **education and demo practice**, with **affiliate disclosure** and a **risk notice**. Before scaling paid ads, align with **Deriv’s affiliate terms** and your ad platform’s policies.

## Stack

- Next.js (App Router), TypeScript, Tailwind CSS v4, [tus-js-client](https://github.com/tus/tus-js-client) (browser upload)
- [src/app/go/route.ts](src/app/go/route.ts) — affiliate redirect  
- [src/app/api/videos/init-upload/route.ts](src/app/api/videos/init-upload/route.ts) — admin-only Bunny create + TUS signature  
- [src/lib/bunny-stream.ts](src/lib/bunny-stream.ts) — list ready videos for the homepage
