/**
 * compare.js
 * Renders the user's own photo with a colored fabric "drape" beneath the chin —
 * the classic color-analysis technique — so different shades can be compared
 * against the same face in the same light. Pure, deterministic, on-device:
 * given the same photo + faceBox + hex it always paints the same pixels, and
 * nothing ever leaves the device.
 *
 * The drape is a shaped silhouette (shoulders curving up to a neckline dip)
 * with soft fabric folds, a neckline sheen, a contact shadow where cloth meets
 * skin, and a subtle color reflection onto the lower face — so a flattering
 * shade visibly lifts the complexion and a clashing one visibly dulls it.
 */

export function renderCompare(canvas, photo, faceBox, hex) {
  const ctx = canvas.getContext("2d");
  const W = (canvas.width = photo.naturalWidth || photo.width);
  const H = (canvas.height = photo.naturalHeight || photo.height);

  ctx.drawImage(photo, 0, 0, W, H);

  // Drape geometry from the detected face bounding box.
  const faceBottom = (faceBox.y + faceBox.h) * H;
  const faceCenterX = (faceBox.x + faceBox.w / 2) * W;
  const drapeTop = Math.min(H - 10, faceBottom + faceBox.h * H * 0.02);
  const drapeWidth = faceBox.w * W * 2.6;
  const left = faceCenterX - drapeWidth / 2;
  const neckDip = drapeTop + faceBox.h * H * 0.12;

  // Shoulders/neckline silhouette — an arc that dips at the neckline.
  const drape = new Path2D();
  drape.moveTo(left, H);
  drape.quadraticCurveTo(faceCenterX - drapeWidth * 0.32, neckDip, faceCenterX, drapeTop);
  drape.quadraticCurveTo(faceCenterX + drapeWidth * 0.32, neckDip, faceCenterX + drapeWidth / 2, H);
  drape.closePath();

  // ── Fabric body: everything below is clipped to the drape shape ──
  ctx.save();
  ctx.clip(drape);

  // Base vertical shading (a touch lighter at the neckline, deeper at the hem).
  const grad = ctx.createLinearGradient(0, drapeTop, 0, H);
  grad.addColorStop(0, shade(hex, 8));
  grad.addColorStop(1, shade(hex, -20));
  ctx.fillStyle = grad;
  ctx.fillRect(left, drapeTop, drapeWidth, H - drapeTop);

  // Soft fabric folds: alternating light/dark vertical bands feathered at edges.
  const folds = 7;
  const bandW = drapeWidth / folds;
  for (let i = 0; i < folds; i++) {
    const fx = left + bandW * (i + 0.5);
    const lift = i % 2 === 0 ? 16 : -14;
    const fg = ctx.createLinearGradient(fx - bandW / 2, 0, fx + bandW / 2, 0);
    fg.addColorStop(0, shadeRGBA(hex, lift, 0));
    fg.addColorStop(0.5, shadeRGBA(hex, lift, 0.45));
    fg.addColorStop(1, shadeRGBA(hex, lift, 0));
    ctx.fillStyle = fg;
    ctx.fillRect(fx - bandW / 2, drapeTop, bandW, H - drapeTop);
  }

  // Contact shadow: darkening just inside the neckline for depth against skin.
  ctx.globalAlpha = 0.2;
  ctx.filter = "blur(7px)";
  ctx.strokeStyle = "#000";
  ctx.lineWidth = Math.max(5, W * 0.011);
  ctx.stroke(drape);
  ctx.restore();

  // ── Neckline sheen: a soft light rim along the top edge of the fabric ──
  ctx.save();
  ctx.globalAlpha = 0.55;
  ctx.filter = "blur(3px)";
  ctx.strokeStyle = shade(hex, 34);
  ctx.lineWidth = Math.max(3, W * 0.006);
  ctx.stroke(drape);
  ctx.restore();

  // ── Ambient color reflection onto the lower face (fabric bouncing color) ──
  ctx.save();
  const rg = ctx.createRadialGradient(
    faceCenterX, faceBottom, faceBox.w * W * 0.1,
    faceCenterX, faceBottom, faceBox.w * W * 0.75
  );
  rg.addColorStop(0, hexA(hex, 0.1));
  rg.addColorStop(1, "transparent");
  ctx.fillStyle = rg;
  ctx.fillRect(0, faceBottom - faceBox.h * H * 0.5, W, faceBox.h * H);
  ctx.restore();
}

/* ---------------- color helpers ---------------- */

function toRGB(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}
const clamp = (v) => Math.max(0, Math.min(255, v));

/** Darken/lighten a hex color by a percentage, returning a new hex. */
function shade(hex, pct) {
  const [r, g, b] = toRGB(hex);
  const a = Math.round(2.55 * pct);
  return `#${((1 << 24) + (clamp(r + a) << 16) + (clamp(g + a) << 8) + clamp(b + a)).toString(16).slice(1)}`;
}

/** Shade a hex by a percentage and return it as an rgba() string. */
function shadeRGBA(hex, pct, alpha) {
  const [r, g, b] = toRGB(hex);
  const a = Math.round(2.55 * pct);
  return `rgba(${clamp(r + a)},${clamp(g + a)},${clamp(b + a)},${alpha})`;
}

/** A hex color as an rgba() string at the given alpha. */
function hexA(hex, alpha) {
  const [r, g, b] = toRGB(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}
