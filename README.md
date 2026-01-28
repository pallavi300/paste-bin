# Pastebin-Lite

A small Pastebin-like app: create text pastes, get a shareable link, optional TTL and view limits.

## Run locally

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment**

   Copy `.env.example` to `.env.local` and set:

   - `KV_REST_API_URL` and `KV_REST_API_TOKEN`: Upstash Redis REST API (create a DB at [upstash.com](https://upstash.com) or use Vercel’s Redis integration).
   - `APP_URL`: Base URL for paste links (e.g. `http://localhost:3000`). Do not hardcode in code.

3. **Start the app**

   ```bash
   npm run dev
   ```

   Then open the base URL (e.g. `http://localhost:3000`). Use the UI to create a paste and open the shared link.

   Without `KV_REST_API_*` configured, `GET /api/healthz` returns 503 and paste creation will fail.

## Persistence

- **Upstash Redis** (HTTP REST). Data is stored in Redis via `@upstash/redis`. No migrations; the app uses a flat key layout (`paste:<id>`).

## Design notes

- **Stack**: Node.js, Express, plain JavaScript. No Next.js, no TypeScript.
- **APIs**: `GET /api/healthz`, `POST /api/pastes`, `GET /api/pastes/:id`. `GET /p/:id` serves the HTML view.
- **Constraints**: Optional `ttl_seconds` and `max_views`. Paste becomes unavailable when either fires first.
- **Testing**: `x-test-now-ms` request header is used as “now” for expiry when present. `TEST_MODE=1` is supported for deterministic grading.
- **Base URL**: From `VERCEL_URL` (on Vercel) or `APP_URL` (local). No hardcoded localhost.

## Deploy

- **Vercel**: Connect the repo; add Upstash Redis (or Redis integration) and set `KV_REST_API_URL`, `KV_REST_API_TOKEN`. `VERCEL_URL` is set automatically for paste links. No custom config required; Express is auto-detected from `server.js`.
- **Railway / Render**: Run `npm start`; set the same env vars and `APP_URL` to your public URL.
