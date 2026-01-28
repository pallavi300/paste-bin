'use strict';

const { nanoid } = require('nanoid');
const { getClient } = require('./kv');

const PREFIX = 'paste:';

function key(id) {
  return PREFIX + id;
}

/**
 * @param {object} body
 * @returns {{ content: string, ttl_seconds?: number, max_views?: number }}
 * @throws {{ status: number, message: string, details?: string }}
 */
function validateCreate(body) {
  if (!body || typeof body !== 'object') {
    throw { status: 400, message: 'Invalid input', details: 'JSON body required.' };
  }
  const { content, ttl_seconds, max_views } = body;

  if (content == null) {
    throw { status: 400, message: 'Invalid input', details: 'content is required.' };
  }
  if (typeof content !== 'string') {
    throw { status: 400, message: 'Invalid input', details: 'content must be a string.' };
  }
  if (content.trim() === '') {
    throw { status: 400, message: 'Invalid input', details: 'content must be non-empty.' };
  }

  const out = { content: content };

  if (ttl_seconds != null) {
    const n = Number(ttl_seconds);
    if (!Number.isInteger(n) || n < 1) {
      throw { status: 400, message: 'Invalid input', details: 'ttl_seconds must be an integer >= 1.' };
    }
    out.ttl_seconds = n;
  }
  if (max_views != null) {
    const n = Number(max_views);
    if (!Number.isInteger(n) || n < 1) {
      throw { status: 400, message: 'Invalid input', details: 'max_views must be an integer >= 1.' };
    }
    out.max_views = n;
  }

  return out;
}

/**
 * @param {{ content: string, ttl_seconds?: number, max_views?: number }} data
 * @param {number} createdAtMs
 * @returns {Promise<{ id: string }>}
 */
async function create(data, createdAtMs) {
  const id = nanoid();
  const doc = {
    content: data.content,
    ttl_seconds: data.ttl_seconds ?? null,
    max_views: data.max_views ?? null,
    created_at: createdAtMs,
    current_views: 0,
  };
  const redis = getClient();
  await redis.set(key(id), JSON.stringify(doc));
  return { id };
}

/**
 * @param {string} id
 * @param {number} nowMs
 * @returns {Promise<null | { content: string, remaining_views: number | null, expires_at: string | null, _doc: object }>}
 */
async function getAndIncrementView(id, nowMs) {
  const redis = getClient();
  const k = key(id);
  const raw = await redis.get(k);
  if (!raw) return null;

  const doc = typeof raw === 'string' ? JSON.parse(raw) : raw;
  const { content, ttl_seconds, max_views, created_at, current_views } = doc;

  if (ttl_seconds != null) {
    const expiresAt = created_at + ttl_seconds * 1000;
    if (nowMs >= expiresAt) return null;
  }

  if (max_views != null && current_views >= max_views) return null;

  const nextViews = (current_views || 0) + 1;
  const updated = { ...doc, current_views: nextViews };
  await redis.set(k, JSON.stringify(updated));

  const remaining = max_views != null ? max_views - nextViews : null;
  let expires_at = null;
  if (ttl_seconds != null) {
    const expiresAtMs = created_at + ttl_seconds * 1000;
    expires_at = new Date(expiresAtMs).toISOString();
  }

  return {
    content,
    remaining_views: remaining,
    expires_at,
    _doc: updated,
  };
}

/**
 * Fetch paste without incrementing view. For existence/expiry checks only.
 * @param {string} id
 * @returns {Promise<object | null>}
 */
async function getById(id) {
  const redis = getClient();
  const raw = await redis.get(key(id));
  if (!raw) return null;
  return typeof raw === 'string' ? JSON.parse(raw) : raw;
}

module.exports = {
  validateCreate,
  create,
  getAndIncrementView,
  getById,
};
