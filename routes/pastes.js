'use strict';

const { validateCreate, create, getAndIncrementView } = require('../lib/pastes');
const { now } = require('../lib/time');
const { pasteUrl } = require('../lib/url');

async function createHandler(req, res) {
  let data;
  try {
    data = validateCreate(req.body);
  } catch (e) {
    if (e && typeof e.status === 'number') {
      res.status(e.status).json({ error: e.message, details: e.details });
      return;
    }
    res.status(400).json({ error: 'Invalid input' });
    return;
  }

  const createdAt = now(req);
  let id;
  try {
    const result = await create(data, createdAt);
    id = result.id;
  } catch (e) {
    const msg = e?.message || String(e);
    console.error('Create paste error:', msg);
    if (e?.cause) console.error('  cause:', e.cause);
    const lower = msg.toLowerCase();
    if (lower.includes('read') || lower.includes('forbidden') || lower.includes('write')) {
      console.error('  → Use the main REST token (not Read-Only). Upstash Console → Connect → REST → uncheck Read-Only Token.');
    }
    res.status(500).json({ error: 'Failed to create paste' });
    return;
  }

  const url = pasteUrl(id);
  res.status(201).json({ id, url });
}

async function getHandler(req, res) {
  const { id } = req.params;
  const nowMs = now(req);

  let result;
  try {
    result = await getAndIncrementView(id, nowMs);
  } catch (e) {
    console.error('Fetch paste error:', e && e.message ? e.message : e);
    res.status(500).json({ error: 'Failed to fetch paste' });
    return;
  }

  if (!result) {
    res.status(404).json({ error: 'Paste not found or no longer available' });
    return;
  }

  res.status(200).json({
    content: result.content,
    remaining_views: result.remaining_views,
    expires_at: result.expires_at,
  });
}

module.exports = { create: createHandler, get: getHandler };
