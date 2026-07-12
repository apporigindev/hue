/**
 * config.js — runtime configuration for the optional generative try-on tier.
 *
 * IMPORTANT: everything here concerns ONLY the paid "See it for real" feature,
 * which is the single part of Seasonist that talks to a backend. The core
 * analysis stays 100% on-device. When TRYON_API_BASE is empty (the default),
 * the feature is completely hidden and no network call is ever made.
 */

// Origin of the try-on backend. Leave empty to disable the feature entirely.
export const TRYON_API_BASE = "https://seasonist-api-production.up.railway.app";

// Shared secret (x-api-key) matching the backend's APP_API_KEY. Left empty in
// the repo (public); the iOS CI stamps the real value into the app bundle at
// build time (see .github/workflows/ios-testflight.yml).
export const APP_API_KEY = "";

// TEST MODE — replaces the real App Store purchase sheets with the clearly
// labelled simulated ones, so the full flow is testable before the Paid Apps
// agreement / sandbox accounts are set up. ALWAYS false in the repo; the iOS
// CI stamps it true only when a build is explicitly triggered with the
// test_unlock input. Such builds must NEVER be submitted for review.
export const TEST_UNLOCK = false;

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
