/**
 * mock.ts — a dev/test-only provider. It does NOT call any model. For each
 * target color it returns a small labelled SVG "preview" card so the end-to-end
 * flow (purchase → consent → generate → gallery) can be exercised offline, with
 * one clearly-fake image per requested color. Never selected in production
 * (see provider.ts).
 */
import type { GeneratedImage, TryOnJob, TryOnProvider } from "./provider.js";

export class MockProvider implements TryOnProvider {
  readonly name = "mock";

  async generate(job: TryOnJob): Promise<GeneratedImage[]> {
    return job.colors.map((c) => ({
      colorName: c.name,
      hex: c.hex,
      dataUrl: card(c.name, c.hex, job.season),
    }));
  }
}

function card(name: string, hex: string, season: string): string {
  const text = readable(hex);
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="600" viewBox="0 0 480 600">` +
    `<rect width="480" height="600" fill="${esc(hex)}"/>` +
    `<rect x="0" y="470" width="480" height="130" fill="rgba(0,0,0,0.28)"/>` +
    `<text x="240" y="250" font-family="sans-serif" font-size="26" fill="${text}" text-anchor="middle" opacity="0.85">PREVIEW</text>` +
    `<text x="240" y="285" font-family="sans-serif" font-size="15" fill="${text}" text-anchor="middle" opacity="0.7">mock generator</text>` +
    `<text x="240" y="520" font-family="sans-serif" font-size="24" fill="#fff" text-anchor="middle">${esc(name)}</text>` +
    `<text x="240" y="552" font-family="sans-serif" font-size="15" fill="#fff" text-anchor="middle" opacity="0.85">${esc(season)}</text>` +
    `</svg>`;
  return "data:image/svg+xml;base64," + Buffer.from(svg, "utf8").toString("base64");
}

/** Pick black/white label text for contrast against the swatch. */
function readable(hex: string): string {
  const n = parseInt(hex.replace("#", ""), 16);
  const r = (n >> 16) & 0xff, g = (n >> 8) & 0xff, b = n & 0xff;
  const luma = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luma > 0.6 ? "#111" : "#fff";
}

const esc = (s: string) =>
  String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));
