/**
 * compare.js
 * Renders the user's own photo with a colored "drape" beneath the chin —
 * the classic color-analysis technique — so different shades can be
 * compared against the same face in the same light.
 */

export function renderCompare(canvas, photo, faceBox, hex) {
  const ctx = canvas.getContext("2d");
  const W = (canvas.width = photo.naturalWidth || photo.width);
  const H = (canvas.height = photo.naturalHeight || photo.height);

  ctx.drawImage(photo, 0, 0, W, H);

  // Drape geometry from the detected face bounding box
  const faceBottom = (faceBox.y + faceBox.h) * H;
  const faceCenterX = (faceBox.x + faceBox.w / 2) * W;
  const drapeTop = Math.min(H - 10, faceBottom + faceBox.h * H * 0.02);
  const drapeWidth = faceBox.w * W * 2.6;

  // Soft-edged fabric-like drape
  const grad = ctx.createLinearGradient(0, drapeTop, 0, H);
  grad.addColorStop(0, hex);
  grad.addColorStop(1, shade(hex, -18));

  ctx.save();
  ctx.beginPath();
  // Shoulders curve: an arc that dips at the neckline
  ctx.moveTo(faceCenterX - drapeWidth / 2, H);
  ctx.quadraticCurveTo(
    faceCenterX - drapeWidth * 0.32,
    drapeTop + faceBox.h * H * 0.12,
    faceCenterX,
    drapeTop
  );
  ctx.quadraticCurveTo(
    faceCenterX + drapeWidth * 0.32,
    drapeTop + faceBox.h * H * 0.12,
    faceCenterX + drapeWidth / 2,
    H
  );
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // Subtle inner shadow at the neckline for depth
  ctx.globalAlpha = 0.15;
  ctx.filter = "blur(6px)";
  ctx.strokeStyle = "#000";
  ctx.lineWidth = Math.max(4, W * 0.008);
  ctx.stroke();
  ctx.restore();

  // Ambient color reflection: a very subtle tint on the lower face,
  // simulating how fabric color bounces onto skin.
  ctx.save();
  ctx.globalAlpha = 0.06;
  ctx.fillStyle = hex;
  const rg = ctx.createRadialGradient(
    faceCenterX, faceBottom, faceBox.w * W * 0.1,
    faceCenterX, faceBottom, faceBox.w * W * 0.75
  );
  rg.addColorStop(0, hex);
  rg.addColorStop(1, "transparent");
  ctx.fillStyle = rg;
  ctx.fillRect(0, faceBottom - faceBox.h * H * 0.5, W, faceBox.h * H);
  ctx.restore();
}

/** Darken/lighten a hex color by a percentage. */
function shade(hex, pct) {
  const n = parseInt(hex.slice(1), 16);
  const amt = Math.round(2.55 * pct);
  const r = clamp((n >> 16) + amt);
  const g = clamp(((n >> 8) & 0xff) + amt);
  const b = clamp((n & 0xff) + amt);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}
const clamp = (v) => Math.max(0, Math.min(255, v));
