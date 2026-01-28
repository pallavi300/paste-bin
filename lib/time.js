'use strict';

/**
 * Current time for expiry logic. Uses x-test-now-ms header when present (TEST_MODE).
 * @param {import('express').Request} req
 * @returns {number} epoch ms
 */
function now(req) {
  const raw = req && req.get && req.get('x-test-now-ms');
  if (raw != null && raw !== '') {
    const n = parseInt(raw, 10);
    if (!Number.isNaN(n)) return n;
  }
  return Date.now();
}

module.exports = { now };
