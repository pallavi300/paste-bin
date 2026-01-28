# Pastebin-Lite – Implementation Plan (Express + Plain JS)

## Stack

| Layer       | Choice                | Notes                                        |
|------------|------------------------|----------------------------------------------|
| Runtime    | Node.js                | Assignment requirement                       |
| Backend    | Express                | No Next.js                                   |
| Language   | Plain JavaScript (.js) | No TypeScript                                |
| Frontend   | HTML + JavaScript      | Create form, view page, errors; minimal UI   |
| Persistence| Vercel KV (Redis)      | Serverless-safe; optional: Upstash Redis     |
| ID         | nanoid                 | Short, URL-safe                              |
| Deploy     | Vercel                 | Express via serverless; or Railway/Render    |

---

## Repo structure

```
paste-bin/
├── README.md
├── package.json
├── .env.example          # KV vars; no real secrets
├── .gitignore
├── api/                  # Vercel serverless entry (if Vercel)
│   └── index.js          # Express app mounted at /
├── server.js             # Express app (dev: node server.js)
├── lib/
│   ├── time.js           # now(req) from x-test-now-ms or Date.now()
│   ├── kv.js             # KV client init
│   └── pastes.js         # create, get, validate, atomic view-increment
├── routes/
│   └── (or inline in server.js) API + /p/:id
├── public/               # Static assets
│   ├── index.html        # Create-paste form
│   └── app.js            # Form submit, fetch, copy link, errors
└── views/                # Optional: server-rendered HTML
    └── paste.html        # Template for /p/:id (or inline in route)
```

For **Vercel**: Express app in `api/index.js`; `vercel.json` routes `/api/*` and `/p/*` to it.  
For **Railway/Render**: Single `server.js`; `npm start` runs `node server.js`.

---

## Data model (KV)

- **Key**: `paste:<id>`
- **Value**: `{ content, ttl_seconds, max_views, created_at, current_views }`
- **id**: `nanoid()`
- **created_at**: epoch ms
- **current_views**: 0 initially; increment only on successful fetch (atomic).

---

## API (exact spec)

### GET /api/healthz

- 200, JSON `{ "ok": true }` only when persistence (KV) is reachable.
- Lightweight check (e.g. KV PING or GET); on failure → 503 or `ok: false` per spec.

### POST /api/pastes

- **Body**: `{ content, ttl_seconds?, max_views? }`
  - `content`: required, non-empty string.
  - `ttl_seconds`, `max_views`: optional, integer ≥ 1.
- **Validation**: invalid → 4xx + JSON error body.
- **Success (2xx)**: `{ "id": "<id>", "url": "https://<base>/p/<id>" }`.
- **Base URL**: from env (`VERCEL_URL`, `APP_URL`, etc.). No hardcoded localhost.

### GET /api/pastes/:id

- **Header**: `x-test-now-ms` (epoch ms) → use as “now” for expiry only when present.
- **Success (200)**: `{ "content": "...", "remaining_views": n | null, "expires_at": "ISO8601" | null }`.
  - `remaining_views`: null if no `max_views`; else after this view.
  - `expires_at`: null if no TTL.
- **View count**: only successful 200 counts as a view; atomic increment.
- **Unavailable** (missing, expired, view limit): 404 + JSON.

### GET /p/:id (HTML)

- 200: HTML page with paste content rendered **safely** (escape; no script execution).
- Unavailable → 404.
- Same fetch + view-increment logic as API (server-side); optional `x-test-now-ms` pass-through.

---

## Constraint logic

- **TTL**: `expires_at = created_at + ttl_seconds * 1000`. “Now” = `x-test-now-ms` ?? `Date.now()`.
- **Max views**: serve only if `current_views < max_views`; atomic increment then return.
- **Combined**: if both set, first trigger (expiry or view limit) → 404.

Order: exists → not expired → under view limit → increment → 200.

---

## TEST_MODE / x-test-now-ms

- `x-test-now-ms`: when present, use for expiry logic only.
- `TEST_MODE=1`: deterministic testing; grading uses header to control time. No extra app logic beyond respecting `x-test-now-ms`.

---

## Frontend (assignment)

- **Create**: Form (content, optional `ttl_seconds`, `max_views`) → submit → show URL + link to `/p/:id`; copy helpful.
- **View**: `/p/:id` shows paste; minimal layout.
- **Errors**: Invalid input, expired, not found → clear messages.
- Design not graded; flows must work.

---

## Security & checklist

- No hardcoded localhost; base URL from env.
- No secrets in repo; `.env` in `.gitignore`.
- No global mutable request state; pass `req` or `x-test-now-ms` through.
- README: description, local run, persistence choice.
- Install/start: `npm install` + `npm run dev` or `npm start`; no manual DB migrations.

---

## Implementation order

1. Scaffold Express app, deps (`express`, `nanoid`, `@vercel/kv`), `.env.example`.
2. `lib/time`, `lib/kv`, `lib/pastes` (create, get, validate, atomic view-increment).
3. `GET /api/healthz`, `POST /api/pastes`.
4. `GET /api/pastes/:id` (TTL, max_views, `x-test-now-ms`).
5. `GET /p/:id` HTML view (safe render, 404 when unavailable).
6. UI: create form, success + link, view page, error display.
7. README, env-based base URL, verify local run.
