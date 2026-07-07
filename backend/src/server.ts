/**
 * server.ts — production entry. Wires the real store + validators and listens.
 */
import { env, googleConfigured } from "./config/env.js";
import { buildApp } from "./app.js";
import { MemoryStore, PostgresStore, type SubscriptionStore } from "./lib/store.js";
import { verifyAppleTransaction, verifyAppleNotification } from "./lib/apple.js";
import { verifyGoogleSubscription, decodeGoogleNotification } from "./lib/google.js";

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

const app = buildApp({
  store,
  verifyAppleTransaction,
  verifyAppleNotification,
  verifyGoogleSubscription,
  decodeGoogleNotification,
  googleEnabled: googleConfigured(),
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
  process.exit(0);
};
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
