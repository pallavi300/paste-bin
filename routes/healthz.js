'use strict';

const { ping } = require('../lib/kv');

async function get(req, res) {
  try {
    await ping();
  } catch (e) {
    res.status(503).json({ ok: false });
    return;
  }
  res.status(200).json({ ok: true });
}

module.exports = { get };
