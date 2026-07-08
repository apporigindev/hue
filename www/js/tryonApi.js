/**
 * tryonApi.js — thin client for the generative try-on backend.
 * The ONLY module in the app that sends the photo off the device, and it only
 * does so after explicit consent + a purchase (see app.js). No-op when the
 * backend is not configured.
 */
import { TRYON_API_BASE, APP_API_KEY, getAppUserId } from "./config.js";

function headers() {
  const h = { "Content-Type": "application/json" };
  if (APP_API_KEY) h["x-api-key"] = APP_API_KEY;
  return h;
}

/** Feature flag: is the paid try-on tier live (backend up + provider set)? */
export async function tryonAvailable() {
  if (!TRYON_API_BASE) return false;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 4000);
    const res = await fetch(`${TRYON_API_BASE}/health`, { signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) return false;
    const j = await res.json();
    return !!j.tryonAvailable;
  } catch {
    return false;
  }
}

/**
 * Generate the try-on images.
 * @param {{ photo:string, season:string, colors:{name:string,hex:string}[],
 *           proof:{transactionId?:string,signedTransaction?:string} }} args
 * @returns {Promise<{colorName:string,hex:string,dataUrl:string}[]>}
 */
export async function generateTryon({ photo, season, colors, proof }) {
  const res = await fetch(`${TRYON_API_BASE}/v1/tryon`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      appUserId: getAppUserId(),
      transactionId: proof?.transactionId || undefined,
      signedTransaction: proof?.signedTransaction || undefined,
      photo,
      season,
      colors,
    }),
  });
  if (!res.ok) {
    let code = `http_${res.status}`;
    try {
      const e = await res.json();
      if (e && e.error) code = e.error;
    } catch {
      /* ignore */
    }
    const err = new Error(code);
    err.code = code;
    throw err;
  }
  const j = await res.json();
  return Array.isArray(j.images) ? j.images : [];
}
