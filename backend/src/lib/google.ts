/**
 * google.ts — Google Play subscription verification (optional / Android).
 * Only active when GOOGLE_PACKAGE_NAME + GOOGLE_SERVICE_ACCOUNT_B64 are set.
 */
import { google } from "googleapis";
import { env, googleConfigured } from "../config/env.js";
import type { SubStatus } from "./store.js";

export class GoogleNotConfiguredError extends Error {
  constructor() {
    super("Google Play is not configured (set GOOGLE_PACKAGE_NAME and GOOGLE_SERVICE_ACCOUNT_B64).");
    this.name = "GoogleNotConfiguredError";
  }
}

export interface GoogleResult {
  productId: string | null;
  originalTransactionId: string | null; // the purchase token
  expiresAt: Date | null;
  status: SubStatus;
}

let publisher: ReturnType<typeof google.androidpublisher> | null = null;

function getClient() {
  if (!googleConfigured()) throw new GoogleNotConfiguredError();
  if (publisher) return publisher;
  const credentials = JSON.parse(
    Buffer.from(env.GOOGLE_SERVICE_ACCOUNT_B64!, "base64").toString("utf8")
  );
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/androidpublisher"],
  });
  publisher = google.androidpublisher({ version: "v3", auth });
  return publisher;
}

function mapState(state: string | null | undefined, notExpired: boolean): SubStatus {
  switch (state) {
    case "SUBSCRIPTION_STATE_ACTIVE":
      return "active";
    case "SUBSCRIPTION_STATE_IN_GRACE_PERIOD":
      return "in_grace";
    case "SUBSCRIPTION_STATE_CANCELED": // auto-renew off but valid until expiry
      return notExpired ? "active" : "expired";
    case "SUBSCRIPTION_STATE_EXPIRED":
    case "SUBSCRIPTION_STATE_ON_HOLD":
    case "SUBSCRIPTION_STATE_PAUSED":
      return "expired";
    default:
      return notExpired ? "active" : "expired";
  }
}

/** Verify a Google Play subscription purchase token via the Play Developer API. */
export async function verifyGoogleSubscription(purchaseToken: string): Promise<GoogleResult> {
  const ap = getClient();
  const { data } = await ap.purchases.subscriptionsv2.get({
    packageName: env.GOOGLE_PACKAGE_NAME!,
    token: purchaseToken,
  });

  const items = data.lineItems ?? [];
  const productId = items[0]?.productId ?? null;
  let expiresAt: Date | null = null;
  for (const it of items) {
    if (it.expiryTime) {
      const d = new Date(it.expiryTime);
      if (!expiresAt || d > expiresAt) expiresAt = d;
    }
  }
  const notExpired = expiresAt === null || expiresAt.getTime() > Date.now();
  return {
    productId,
    originalTransactionId: purchaseToken,
    expiresAt,
    status: mapState(data.subscriptionState, notExpired),
  };
}

/** Decode a Google Play Real-time Developer Notification (Pub/Sub push). */
export function decodeGoogleNotification(body: any): {
  purchaseToken: string | null;
  productId: string | null;
} {
  try {
    const dataB64 = body?.message?.data;
    if (!dataB64) return { purchaseToken: null, productId: null };
    const payload = JSON.parse(Buffer.from(dataB64, "base64").toString("utf8"));
    const sub = payload.subscriptionNotification;
    return {
      purchaseToken: sub?.purchaseToken ?? null,
      productId: sub?.subscriptionId ?? null,
    };
  } catch {
    return { purchaseToken: null, productId: null };
  }
}
