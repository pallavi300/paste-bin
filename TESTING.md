# Pastebin-Lite – Testing Guide

## 1. Server chalao

```bash
cd /Users/pallavisahu/Documents/assignments/paste-bin
npm run dev
```

Console pe `Listening on port 3000` (ya 3001, …) aana chahiye.  
Base URL = `http://localhost:3000` (ya jo port dikhe). Neeche `BASE` use kiya hai.

---

## 2. Health check

**Browser:** `http://localhost:3000/api/healthz`  
**ya curl:**
```bash
curl -s http://localhost:3000/api/healthz
```

**Expected:** `{"ok":true}`  
Agar `{"ok":false}` ya 503 aaye → Redis (`.env` me `KV_REST_API_*`) check karo.

---

## 3. Paste create karo (API)

```bash
curl -s -X POST http://localhost:3000/api/pastes \
  -H "Content-Type: application/json" \
  -d '{"content":"Hello world"}'
```

**Expected:** `{"id":"...","url":"http://localhost:3000/p/..."}`  
`id` aur `url` copy karo – agli steps me use hoga.

---

## 4. Paste view karo (API)

Replace `PASTE_ID` with real id from step 3:

```bash
curl -s http://localhost:3000/api/pastes/PASTE_ID
```

**Expected:**  
`{"content":"Hello world","remaining_views":null,"expires_at":null}`  
(yadi `max_views` / `ttl_seconds` nahi diye).

---

## 5. Paste view karo (HTML / browser)

Browser me `http://localhost:3000/p/PASTE_ID` kholo.  
**Expected:** Page pe "Hello world" dikhe.

---

## 6. UI se create + view

1. Browser: `http://localhost:3000`
2. Textarea me kuch likho → **Create paste** click
3. **Expected:** "Paste created" + link dikhe
4. **Copy link** click → nayi tab me `/p/...` kholo → content dikhna chahiye

---

## 7. Validation (invalid input)

```bash
# Empty content
curl -s -X POST http://localhost:3000/api/pastes \
  -H "Content-Type: application/json" \
  -d '{"content":""}'
```
**Expected:** 4xx + JSON error, e.g. `{"error":"Invalid input","details":"..."}`

```bash
# Missing content
curl -s -X POST http://localhost:3000/api/pastes \
  -H "Content-Type: application/json" \
  -d '{}'
```
**Expected:** 4xx + JSON error.

---

## 8. Max views (view limit)

```bash
# Create paste with max_views=1
curl -s -X POST http://localhost:3000/api/pastes \
  -H "Content-Type: application/json" \
  -d '{"content":"One view only","max_views":1}'
# id copy karo

# 1st fetch – 200 OK
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/pastes/PASTE_ID

# 2nd fetch – 404
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/pastes/PASTE_ID
```

**Expected:** pehla `200`, doosra `404`.

---

## 9. TTL + `x-test-now-ms` (expiry)

```bash
# Create with ttl_seconds=60
curl -s -X POST http://localhost:3000/api/pastes \
  -H "Content-Type: application/json" \
  -d '{"content":"Expires soon","ttl_seconds":60}'
# id copy karo

# “Now” = create time – 200 OK
curl -s -X POST http://localhost:3000/api/pastes \
  -H "Content-Type: application/json" \
  -d '{"content":"x","ttl_seconds":60}' | grep -o '"id":"[^"]*"'
# created_at kab set hua, wo exact time nahi milta, so typically we use x-test-now-ms on GET

# Fetch with x-test-now-ms = 1 Jan 2020 (past) → expired
# First get create time: use “now” as create time. Easiest: create at T, then fetch with x-test-now-ms = T + 61000 (past expiry)
curl -s -H "x-test-now-ms: 1577836800000" http://localhost:3000/api/pastes/PASTE_ID
```
Agar paste create time 2020 se pehle hai to expired; **Expected:** 404 + JSON.

Practical:  
1. Create paste with `ttl_seconds=60`.  
2. Fetch **without** header → 200.  
3. Fetch **with** `x-test-now-ms: <created_at + 61000>` (epoch ms) → 404.

---

## 10. 404 (missing paste)

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/pastes/nonexistent123
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/p/nonexistent123
```

**Expected:** dono `404`.

---

## Quick checklist

| Check | Command / Action | Expected |
|-------|------------------|----------|
| Health | `GET /api/healthz` | 200, `{"ok":true}` |
| Create | `POST /api/pastes` with `{"content":"..."}` | 201, `{id, url}` |
| Get paste | `GET /api/pastes/:id` | 200, `{content, remaining_views, expires_at}` |
| View HTML | `GET /p/:id` in browser | 200, paste content |
| Invalid create | `POST` with `""` or no content | 4xx, JSON error |
| Max views | create `max_views=1`, fetch twice | 200 then 404 |
| Missing paste | `GET /api/pastes/fakeid`, `GET /p/fakeid` | 404 |

---

## 11. Automated API tests (`npm test`)

**Pehle server chalao** (ek terminal me):

```bash
npm run dev
```

**Doosri terminal me:**

```bash
npm test
```

Ye script `GET /api/healthz`, `POST /api/pastes`, `GET /api/pastes/:id`, validation, `max_views`, 404 check karegi.  
`APP_URL` (ya `BASE_URL`) env me set ho to woh use hota hai, warna `http://localhost:3000`.
