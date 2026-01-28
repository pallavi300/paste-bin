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

### Deploy to Vercel

1. **Push your code to GitHub/GitLab/Bitbucket**
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com) and sign in
   - Click "Add New Project"
   - Import your repository
   - Vercel will auto-detect it's a Node.js project

3. **Set up Upstash Redis**
   
   **Option A: Use Vercel's Redis Integration (Recommended)**
   - In your Vercel project dashboard, go to **Storage** → **Create Database** → **Redis**
   - This automatically sets `KV_REST_API_URL` and `KV_REST_API_TOKEN` environment variables
   
   **Option B: Use External Upstash Redis**
   - Create a database at [console.upstash.com](https://console.upstash.com)
   - Go to your database → **Connect** → **REST API** tab
   - Copy the **REST URL** and **REST Token** (make sure it's NOT the Read-Only token)
   - In Vercel project settings → **Environment Variables**, add:
     - `KV_REST_API_URL` = your REST URL
     - `KV_REST_API_TOKEN` = your REST Token

4. **Deploy**
   - Click **Deploy** (or push a new commit to trigger auto-deployment)
   - Vercel will automatically:
     - Build your project
     - Set `VERCEL_URL` environment variable (used for paste links)
     - Deploy to a production URL

5. **Verify**
   - Visit your deployed URL
   - Check `/api/healthz` endpoint - should return 200 if Redis is configured correctly
   - Create a test paste to ensure everything works

**Note**: The `vercel.json` configuration file is included to ensure proper routing. Vercel will automatically detect Express from `server.js` and use the Node.js runtime.

### Deploy to Railway / Render

Run `npm start`; set the same env vars (`KV_REST_API_URL`, `KV_REST_API_TOKEN`) and `APP_URL` to your public URL.
