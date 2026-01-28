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
      '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Error</title></head><body><p>Something went wrong.</p></body></html>'
    );
    return;
  }

  if (!result) {
    res.status(404).set('Content-Type', 'text/html').send(
      '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Paste not found</title></head><body><p>Paste not found or no longer available.</p></body></html>'
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
    body { font-family: system-ui, sans-serif; max-width: 720px; margin: 2rem auto; padding: 0 1rem; }
    pre { white-space: pre-wrap; word-break: break-word; background: #f5f5f5; padding: 1rem; border-radius: 6px; }
  </style>
</head>
<body>
  <pre>${escaped}</pre>
</body>
</html>`;

  res.status(200).set('Content-Type', 'text/html').send(html);
}

module.exports = { get };
