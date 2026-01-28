'use strict';

const { Redis } = require('@upstash/redis');

function clean(s) {
  if (typeof s !== 'string') return '';
  s = s.trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'")))
    s = s.slice(1, -1).trim();
  return s;
}

const url = clean(process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '');
const token = clean(process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '');

let client = null;

function getClient() {
  if (!client) {
    if (!url || !token) {
      throw new Error('Missing KV_REST_API_URL / KV_REST_API_TOKEN (or UPSTASH_*). See .env.example.');
    }
    client = new Redis({ url, token });
  }
  return client;
}

async function ping() {
  const redis = getClient();
  await redis.ping();
}

module.exports = { getClient, ping };
