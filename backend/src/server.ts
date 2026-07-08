/**
 * server.ts — production entry. Wires the real store + validators and listens.
 */
import { env, googleConfigured } from "./config/env.js";
import { buildApp } from "./app.js";
import { MemoryStore, PostgresStore, type SubscriptionStore } from "./lib/store.js";
import {
  verifyAppleTransaction,
  verifyAppleTransactionId,
  verifyAppleNotification,
  appStoreApiConfigured,
} from "./lib/apple.js";
import { verifyGoogleSubscription, decodeGoogleNotification } from "./lib/google.js";
import { getProvider } from "./lib/tryon/provider.js";
import {
  MemoryConsumedStore,
  PostgresConsumedStore,
  type ConsumedStore,
} from "./lib/tryon/consumed.js";

let store: SubscriptionStore;
if (env.DATABASE_URL) {
  store = new PostgresStore(env.DATABASE_URL);
} else {
  console.warn(
    "⚠️  No DATABASE_URL set — using an in-memory store. Entitlements will NOT " +
      "persist across restarts. Set DATABASE_URL in production."
  );
  store = new MemoryStore();
}

const consumed: ConsumedStore = env.DATABASE_URL
  ? new PostgresConsumedStore(env.DATABASE_URL)
  : new MemoryConsumedStore();

let tryonProvider = getProvider();
const devBypass = env.TRYON_DEV_BYPASS && env.NODE_ENV !== "production";

// Safety guard: never run the paid endpoint open in production. The API key is
// the only caller gate, so without it the endpoint would be an unauthenticated,
// cost-bearing surface — disable the feature instead.
if (tryonProvider && env.NODE_ENV === "production" && !env.APP_API_KEY) {
  console.error("⛔ Try-on disabled: APP_API_KEY is required in production for the paid /v1/tryon endpoint.");
  tryonProvider = null;
}

// Advertise the feature only when purchases can actually be verified. The
// transactionId proof path needs the App Store Server API credentials; dev
// bypass (non-prod) needs no verification.
const verifyReady = devBypass || appStoreApiConfigured();
if (tryonProvider && !verifyReady) {
  console.warn(
    "⚠️  Try-on provider is set but purchase verification is NOT configured — set " +
      "APPLE_ISSUER_ID / APPLE_KEY_ID / APPLE_PRIVATE_KEY. The feature stays OFF until it is."
  );
}
if (tryonProvider) {
  console.log(`✅ Try-on provider: ${tryonProvider.name} (verifiable: ${verifyReady})`);
} else {
  console.warn(
    "ℹ️  Try-on ('See it for real') is OFF — set TRYON_PROVIDER + FAL_API_KEY (+ App Store " +
      "Server API creds, + APP_API_KEY in prod). The app hides the feature until /health reports tryonAvailable."
  );
}

const app = buildApp({
  store,
  verifyAppleTransaction,
  verifyAppleNotification,
  verifyGoogleSubscription,
  decodeGoogleNotification,
  googleEnabled: googleConfigured(),
  tryon: {
    provider: tryonProvider,
    verifyReady,
    consumed,
    // Prefer the App Store Server API lookup when its credentials are set.
    verifyTransactionId: appStoreApiConfigured() ? verifyAppleTransactionId : undefined,
    productId: env.TRYON_PRODUCT_ID,
    maxColors: env.TRYON_MAX_COLORS,
    maxAttempts: env.TRYON_MAX_ATTEMPTS,
    maxImageBytes: Math.floor(env.TRYON_MAX_IMAGE_MB * 1024 * 1024),
    ratePerMin: env.TRYON_RATE_PER_MIN,
    devBypass,
    log: (m, e) => console.warn(m, e),
  },
});

app.listen({ port: env.PORT, host: "0.0.0.0" }, (err, address) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
  app.log.info(`Seasonist subscription backend listening on ${address}`);
});

const shutdown = async () => {
  await app.close();
  await store.close();
  await consumed.close();
  process.exit(0);
};
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
