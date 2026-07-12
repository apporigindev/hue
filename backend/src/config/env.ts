/**
 * env.ts — startup configuration, validated with Zod.
 * Apple config is required to verify iOS purchases; Google config is optional
 * (Android can be added later). The server boots without a DATABASE_URL by
 * falling back to an in-memory store (dev/test only — not for production).
 */
import { z } from "zod";

const boolish = (def: boolean) =>
  z.preprocess(
    (v) => (v === undefined ? def : v === "true" || v === "1" || v === true),
    z.boolean()
  );

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(8080),

  // Persistence. If absent, an in-memory store is used (a startup warning is
  // logged). Production MUST set DATABASE_URL.
  DATABASE_URL: z.string().url().optional(),

  // ── Apple (App Store) ──────────────────────────────────────────────
  APPLE_BUNDLE_ID: z.string().min(1).default("com.apporigin.seasonist"),
  // Numeric App Store app id (appAppleId). Required for production
  // transaction verification; may be omitted in Sandbox.
  APPLE_APP_APPLE_ID: z.coerce.number().optional(),
  APPLE_ENVIRONMENT: z.enum(["Sandbox", "Production"]).default("Sandbox"),
  // Directory holding the Apple root CA certificates (.cer/.pem) downloaded
  // from https://www.apple.com/certificateauthority/. Without them, purchase
  // verification is disabled and the relevant routes return 503.
  APPLE_ROOT_CERTS_DIR: z.string().default("./certs"),
  APPLE_ENABLE_ONLINE_CHECKS: boolish(false),

  // App Store Server API credentials. Optional for the subscription verify +
  // notifications flow (signature-verified locally), but REQUIRED for the
  // "See it for real" try-on tier: its transactionId proof path calls Apple's
  // API, so without these the try-on feature stays off (see server.ts).
  APPLE_ISSUER_ID: z.string().optional(),
  APPLE_KEY_ID: z.string().optional(),
  // .p8 contents (PEM). Hosting dashboards often store newlines as literal
  // "\n" — normalize so the key parses either way.
  APPLE_PRIVATE_KEY: z
    .string()
    .transform((v) => v.replace(/\\n/g, "\n"))
    .optional(),

  // ── Google Play (optional — Android) ──────────────────────────────
  GOOGLE_PACKAGE_NAME: z.string().optional(),
  // Service-account JSON, base64-encoded (Play Developer API access).
  GOOGLE_SERVICE_ACCOUNT_B64: z.string().optional(),

  // Shared secret the app sends (header x-api-key) so only your app can call
  // the verify endpoint. Optional but recommended in production.
  APP_API_KEY: z.string().optional(),

  // ── "See it for real" generative try-on ───────────────────────────
  // Which generative provider powers the paid try-on tier. "off" (default)
  // hides the feature; the app flags on /health.tryonAvailable. "mock" is
  // dev/test only. "fal" requires FAL_API_KEY.
  TRYON_PROVIDER: z.enum(["off", "fal", "mock"]).default("off"),
  FAL_API_KEY: z.string().optional(),
  // The fal.ai image-edit model id (confirm against fal.ai docs before launch).
  TRYON_MODEL: z.string().default("fal-ai/flux-pro/kontext"),
  // The consumable product id that entitles a try-on pack.
  TRYON_PRODUCT_ID: z.string().default("seasonist.tryon.unlock"),
  // How many color renders one purchased pack yields.
  TRYON_MAX_COLORS: z.coerce.number().int().positive().max(12).default(5),
  // Max attempts per purchased pack (bounded-retry cost cap — see consumed.ts).
  TRYON_MAX_ATTEMPTS: z.coerce.number().int().positive().max(10).default(3),
  // Max decoded selfie size accepted by /v1/tryon.
  TRYON_MAX_IMAGE_MB: z.coerce.number().positive().max(25).default(10),
  // Requests per minute per IP allowed on /v1/tryon (basic flood protection).
  TRYON_RATE_PER_MIN: z.coerce.number().int().positive().max(240).default(20),
  // Dev/test ONLY: skip purchase verification + replay protection so the flow
  // can be exercised without a real StoreKit transaction. Ignored in production.
  TRYON_DEV_BYPASS: boolish(false),

  // EXTRA CORS origins (comma-separated) for a web client or local browser QA.
  // The Capacitor app's own webview origins (capacitor://localhost, localhost)
  // are ALWAYS allowed by the backend, so try-on works on-device without setting
  // this. "*" allows any origin (dev only).
  CORS_ORIGINS: z.string().optional(),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error("Invalid environment configuration:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export const appleConfigured = () => true; // bundle id always has a default
export const googleConfigured = () =>
  !!(env.GOOGLE_PACKAGE_NAME && env.GOOGLE_SERVICE_ACCOUNT_B64);
