/**
 * classify.js
 * Rule-based 12-season classification from sampled colors.
 *
 * The three axes of seasonal color analysis:
 *   1. TEMPERATURE (warm ↔ cool)  — skin undertone, from Lab hue angle
 *   2. VALUE (light ↔ deep)       — overall depth of skin + hair
 *   3. CHROMA (bright ↔ soft)     — clarity vs mutedness, from Lab chroma
 *                                    + skin/hair/eye contrast
 *
 * NOTE FOR TUNING: the thresholds below are sensible starting points,
 * not validated truths. They MUST be tuned against a diverse test set
 * of photos (varied skin tones, lighting) before launch. See README.
 */

import { rgbToLab } from "./analysis.js";

export function classify({ skin, eyes, hair }) {
  const skinLab = rgbToLab(skin);
  const hairLab = rgbToLab(hair);
  const eyeLab = rgbToLab(eyes);

  /* ---- 1. Temperature: hue angle of skin in Lab a-b plane ----
     Warm undertones push toward yellow (higher b relative to a);
     cool undertones toward pink/blue (higher a relative to b).   */
  const hueAngle = (Math.atan2(skinLab.b, skinLab.a) * 180) / Math.PI;
  // Typical skin hue angles run ~35° (cool/pink) to ~75° (warm/golden).
  // Quantize to a coarse grid (aligned to the ±0.12 boundary) BEFORE
  // thresholding so sub-pixel sampling jitter can't flip a borderline face
  // between warm and cool. Determinism, not tuning — see the pipeline report.
  const warmth = quant(clamp((hueAngle - 45) / 25, -1, 1), 0.04); // -1 cool … +1 warm
  const isWarm = warmth > 0.12;
  const isCool = warmth < -0.12;
  // between: "neutral" — value & chroma decide the season group

  /* ---- 2. Value: combined depth of skin and hair ---- */
  const depth = quant(skinLab.L * 0.55 + hairLab.L * 0.45, 2); // 0 dark … 100 light
  const isLight = depth > 62;
  const isDark = depth < 38;

  /* ---- 3. Chroma: skin clarity + feature contrast ---- */
  const skinChroma = Math.hypot(skinLab.a, skinLab.b);
  const contrast =
    Math.abs(skinLab.L - hairLab.L) * 0.6 + Math.abs(skinLab.L - eyeLab.L) * 0.4;
  const brightness = quant(skinChroma * 0.5 + contrast * 0.5, 2);
  const isBright = brightness > 34;
  const isSoft = brightness < 24;

  /* ---- Decision tree: dominant characteristic first ---- */
  let key;
  if (isDark) {
    key = isWarm ? "darkAutumn" : "darkWinter";
  } else if (isLight) {
    key = isWarm ? "lightSpring" : "lightSummer";
  } else if (isBright) {
    key = isWarm ? "brightSpring" : "brightWinter";
  } else if (isSoft) {
    key = isWarm ? "softAutumn" : "softSummer";
  } else {
    // Medium value, medium chroma: temperature is the deciding axis
    if (isWarm) key = warmth > 0.45 ? "trueAutumn" : "trueSpring";
    else if (isCool) key = warmth < -0.45 ? "trueWinter" : "trueSummer";
    else key = brightness > 29 ? "trueSpring" : "softSummer";
  }

  return {
    key,
    metrics: {
      warmth: round2(warmth),
      depth: round2(depth),
      brightness: round2(brightness),
      // i18n keys (translated for display in app.js) — not display strings.
      undertone: isWarm ? "warm" : isCool ? "cool" : "neutral",
      value: isLight ? "light" : isDark ? "deep" : "medium",
      chroma: isBright ? "bright" : isSoft ? "soft" : "balanced",
    },
  };
}

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const round2 = (v) => Math.round(v * 100) / 100;
// Snap a metric to a coarse grid so near-identical inputs classify identically.
const quant = (v, step) => Math.round(v / step) * step;
