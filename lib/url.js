'use strict';

/**
 * Base URL for paste links. From VERCEL_URL (Vercel) or APP_URL (local). No hardcoded localhost.
 * @returns {string}
 */
function baseUrl() {
  const v = process.env.VERCEL_URL;
  if (v) return `https://${v}`;
  return process.env.APP_URL || '';
}

function pasteUrl(id) {
  const base = baseUrl();
  if (!base) return `/p/${id}`;
  return `${base.replace(/\/$/, '')}/p/${id}`;
}

module.exports = { baseUrl, pasteUrl };
