'use strict';

/**
 * API tests. Run with: npm test
 * Server must be running (npm run dev) on BASE_URL (default http://localhost:3000).
 * Redis (Upstash) must be configured in .env – else healthz/create will fail.
 */

require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const BASE = process.env.APP_URL || process.env.BASE_URL || 'http://localhost:3000';
let passed = 0;
let failed = 0;

function ok(name, condition, detail = '') {
  if (condition) {
    passed++;
    console.log('✓ ' + name + (detail ? ' ' + detail : ''));
  } else {
    failed++;
    console.log('✗ ' + name + (detail ? ' ' + detail : ''));
  }
}

function logFail(label, res, body) {
  try {
    const b = typeof body === 'string' ? body : JSON.stringify(body);
    console.log('  → ' + label + ': status ' + res.status + ', body ' + b.slice(0, 120));
  } catch (_) {}
}

async function fetchJson(url, opts = {}) {
  const res = await fetch(url, opts);
  let body;
  try {
    const text = await res.text();
    body = text ? JSON.parse(text) : {};
  } catch {
    body = null;
  }
  return { res, body };
}

async function run() {
  console.log('Testing base URL: ' + BASE);
  console.log('(Server must be running: npm run dev. Redis in .env required.)\n');

  try {
    const { res: r1, body: j1 } = await fetchJson(BASE + '/api/healthz');
    ok('GET /api/healthz returns 200', r1.status === 200);
    if (r1.status !== 200) logFail('healthz', r1, j1);
    ok('GET /api/healthz { ok: true }', j1 && j1.ok === true);
    if (!(j1 && j1.ok === true)) logFail('healthz', r1, j1);

    if (r1.status !== 200 || !(j1 && j1.ok === true)) {
      console.log('\n  ⚠ Redis not OK. Check .env: KV_REST_API_URL, KV_REST_API_TOKEN (Upstash).');
      console.log('  Restart server (npm run dev) after fixing .env.\n');
    }

    const { res: r2, body: j2 } = await fetchJson(BASE + '/api/pastes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'Test paste from npm test' }),
    });
    ok('POST /api/pastes returns 2xx', r2.status >= 200 && r2.status < 300);
    if (r2.status < 200 || r2.status >= 300) logFail('create', r2, j2);
    ok('POST /api/pastes returns id and url', !!(j2 && j2.id && j2.url));
    if (!(j2 && j2.id && j2.url)) logFail('create', r2, j2);

    const id = j2 && j2.id;
    if (!id) {
      console.log('  (skipping get tests – no id)');
    } else {
      const { res: r3, body: j3 } = await fetchJson(BASE + '/api/pastes/' + id);
      ok('GET /api/pastes/:id returns 200', r3.status === 200);
      ok('GET /api/pastes/:id has content', !!(j3 && j3.content === 'Test paste from npm test'));

      const { res: r4 } = await fetchJson(BASE + '/api/pastes/' + id);
      ok('GET /api/pastes/:id again (no max_views) still 200', r4.status === 200);
    }

    const { res: r5, body: j5 } = await fetchJson(BASE + '/api/pastes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: '' }),
    });
    ok('POST /api/pastes empty content returns 4xx', r5.status >= 400 && r5.status < 500);
    ok('POST /api/pastes empty content returns JSON error', !!(j5 && (j5.error || j5.details)));

    const { res: r5b, body: j5b } = await fetchJson(BASE + '/api/pastes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'One view', max_views: 1 }),
    });
    const id1 = j5b && j5b.id;
    if (id1) {
      const { res: a } = await fetchJson(BASE + '/api/pastes/' + id1);
      const { res: b } = await fetchJson(BASE + '/api/pastes/' + id1);
      ok('max_views=1: first fetch 200', a.status === 200);
      ok('max_views=1: second fetch 404', b.status === 404);
    }

    const { res: r6 } = await fetchJson(BASE + '/api/pastes/nonexistent12345');
    ok('GET /api/pastes/fake-id returns 404', r6.status === 404);
    if (r6.status !== 404) console.log('  → fake-id API: status ' + r6.status);

    const { res: r7 } = await fetchJson(BASE + '/p/nonexistent12345');
    ok('GET /p/fake-id returns 404', r7.status === 404);
    if (r7.status !== 404) console.log('  → fake-id /p: status ' + r7.status);
  } catch (e) {
    console.error('Error:', e.message);
    failed++;
  }

  console.log('\n' + passed + ' passed, ' + failed + ' failed');
  process.exit(failed > 0 ? 1 : 0);
}

run();
