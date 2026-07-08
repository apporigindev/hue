/**
 * provider.ts — the generative "try-on" provider abstraction.
 *
 * A provider takes ONE selfie (as a data URI) plus a set of target palette
 * colors and returns, for each color, a photorealistic image of the SAME
 * person wearing a top in that color. Implementations call a hosted image
 * model (fal.ai / Replicate). A `mock` provider (dev/test only) returns cheap
 * placeholder images so the whole purchase → consent → generate → gallery flow
 * can be exercised without a paid API key.
 *
 * The photo is held only in memory for the duration of the request and is never
 * persisted or logged (see the route + privacy policy).
 */
import { env } from "../../config/env.js";
import { FalProvider } from "./fal.js";
import { MockProvider } from "./mock.js";

export interface TargetColor {
  name: string;
  hex: string; // #RRGGBB
}

export interface TryOnJob {
  photo: string; // data URI: data:image/jpeg;base64,...
  season: string; // e.g. "True Autumn" — prompt context
  colors: TargetColor[];
  attempt?: number; // 1-based retry count — varies the seed so retries differ
}

export interface GeneratedImage {
  colorName: string;
  hex: string;
  dataUrl: string; // resulting image as a data URI
}

export interface TryOnProvider {
  readonly name: string;
  generate(job: TryOnJob): Promise<GeneratedImage[]>;
}

let cached: TryOnProvider | null | undefined;

/**
 * Resolve the configured provider, or null if the feature is not available
 * (no key / disabled). Memoized. The app feature-flags on this via /health.
 */
export function getProvider(): TryOnProvider | null {
  if (cached !== undefined) return cached;
  cached = build();
  return cached;
}

/** Test seam: force re-resolution (e.g. after changing env in a test). */
export function resetProvider(): void {
  cached = undefined;
}

function build(): TryOnProvider | null {
  switch (env.TRYON_PROVIDER) {
    case "fal":
      return env.FAL_API_KEY ? new FalProvider(env.FAL_API_KEY, env.TRYON_MODEL) : null;
    case "mock":
      // The mock never runs in production, so a stray config can't ship fakes.
      return env.NODE_ENV === "production" ? null : new MockProvider();
    case "off":
    default:
      return null;
  }
}

export function tryonAvailable(): boolean {
  return getProvider() !== null;
}
