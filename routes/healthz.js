'use strict';

const { ping } = require('../lib/kv');

async function get(req, res) {
  try {
    await ping();
  } catch (e) {
    console.error('Healthz Redis ping failed:', e?.message || e);
    res.status(503).json({ ok: false });
    return;
  }
  res.status(200).json({ ok: true });
}

module.exports = { get };
