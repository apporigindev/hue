/**
 * config.js — runtime configuration for the optional generative try-on tier.
 *
 * IMPORTANT: everything here concerns ONLY the paid "See it for real" feature,
 * which is the single part of Seasonist that talks to a backend. The core
 * analysis stays 100% on-device. When TRYON_API_BASE is empty (the default),
 * the feature is completely hidden and no network call is ever made.
 */

// Origin of the try-on backend, e.g. "https://seasonist-api.up.railway.app".
// Leave empty to disable the feature entirely.
export const TRYON_API_BASE = "";

// Optional shared secret (x-api-key) if the backend sets APP_API_KEY.
export const APP_API_KEY = "";

/** A stable, anonymous, on-device id used to correlate purchases (no PII). */
export function getAppUserId() {
  const KEY = "seasonist_app_user_id";
  try {
    let id = localStorage.getItem(KEY);
    if (!id) {
      id =
        (crypto.randomUUID && crypto.randomUUID()) ||
        "u-" + Math.abs(Date.now() ^ (Math.random() * 1e9)).toString(36);
      localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    return "anon";
  }
}
