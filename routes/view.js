'use strict';

const { getAndIncrementView } = require('../lib/pastes');
const { now } = require('../lib/time');

function escapeHtml(s) {
  if (typeof s !== 'string') return '';
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function get(req, res) {
  const { id } = req.params;
  const nowMs = now(req);

  let result;
  try {
    result = await getAndIncrementView(id, nowMs);
  } catch (e) {
    res.status(500).set('Content-Type', 'text/html').send(
      `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Error</title>
  <style>
    *{box-sizing:border-box}
    body{font-family:'Segoe UI',system-ui,sans-serif;max-width:560px;margin:0 auto;padding:2rem 1.25rem;background:#f8f9fa;color:#1a1a1a;line-height:1.5;min-height:100vh}
    a{color:#0d6efd;text-decoration:none}
    a:hover{text-decoration:underline}
    .card{background:#fff;border-radius:10px;padding:1.5rem;box-shadow:0 1px 3px rgba(0,0,0,.06);border:1px solid #e9ecef}
    h1{font-size:1.25rem;margin:0 0 0.5rem;color:#212529}
    p{margin:0;color:#6c757d}
    p.mt{margin-top:1rem}
  </style>
</head>
<body>
  <div class="card">
    <h1>Something went wrong</h1>
    <p>Please try again later.</p>
    <p class="mt"><a href="/">Back to Pastebin-Lite</a></p>
  </div>
</body>
</html>`
    );
    return;
  }

  if (!result) {
    res.status(404).set('Content-Type', 'text/html').send(
      `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Paste not found</title>
  <style>
    *{box-sizing:border-box}
    body{font-family:'Segoe UI',system-ui,sans-serif;max-width:560px;margin:0 auto;padding:2rem 1.25rem;background:#f8f9fa;color:#1a1a1a;line-height:1.5;min-height:100vh}
    a{color:#0d6efd;text-decoration:none}
    a:hover{text-decoration:underline}
    .card{background:#fff;border-radius:10px;padding:1.5rem;box-shadow:0 1px 3px rgba(0,0,0,.06);border:1px solid #e9ecef}
    h1{font-size:1.25rem;margin:0 0 0.5rem;color:#212529}
    p{margin:0;color:#6c757d;font-size:0.95rem}
  </style>
</head>
<body>
  <div class="card">
    <h1>Paste not found</h1>
    <p>This paste doesn't exist, has expired, or has reached its view limit.</p>
    <p style="margin-top:1rem"><a href="/">Create a new paste</a></p>
  </div>
</body>
</html>`
    );
    return;
  }

  const escaped = escapeHtml(result.content);
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Paste</title>
  <style>
    *{box-sizing:border-box}
    body{font-family:'Segoe UI',system-ui,sans-serif;max-width:720px;margin:0 auto;padding:2rem 1.25rem;background:#f8f9fa;color:#1a1a1a;line-height:1.5;min-height:100vh}
    a{color:#0d6efd;text-decoration:none}
    a:hover{text-decoration:underline}
    header{margin-bottom:1.5rem;padding-bottom:1rem;border-bottom:1px solid #e9ecef}
    header h1{font-size:1.1rem;font-weight:600;margin:0;color:#212529}
    .card{background:#fff;border-radius:10px;padding:1.5rem;box-shadow:0 1px 3px rgba(0,0,0,.06);border:1px solid #e9ecef}
    pre{white-space:pre-wrap;word-break:break-word;margin:0;font-size:0.95rem;font-family:ui-monospace,monospace;line-height:1.5}
  </style>
</head>
<body>
  <header>
    <a href="/">← Pastebin-Lite</a>
  </header>
  <div class="card">
    <pre>${escaped}</pre>
  </div>
</body>
</html>`;

  res.status(200).set('Content-Type', 'text/html').send(html);
}

module.exports = { get };
