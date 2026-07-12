/**
 * apple.ts — App Store purchase + notification verification using Apple's
 * official @apple/app-store-server-library. All verification is cryptographic
 * and happens locally (the JWS is signed by Apple); no network call is needed
 * for the verify/notification flow.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  SignedDataVerifier,
  AppStoreServerAPIClient,
  Environment,
  type JWSTransactionDecodedPayload,
  type ResponseBodyV2DecodedPayload,
} from "@apple/app-store-server-library";
import { env } from "../config/env.js";
import type { SubStatus } from "./store.js";

export class AppleNotConfiguredError extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = "AppleNotConfiguredError";
  }
}

export interface AppleResult {
  productId: string | null;
  transactionId: string | null; // unique per purchase — used for consumable replay protection
  originalTransactionId: string | null;
  appAccountToken: string | null; // = our anonymous appUserId, if the app set it
  expiresAt: Date | null;
  environment: string | null;
  status: SubStatus;
}

let verifier: SignedDataVerifier | null = null;

function loadRootCerts(): Buffer[] {
  let files: string[] = [];
  try {
    files = readdirSync(env.APPLE_ROOT_CERTS_DIR).filter((f) => /\.(cer|pem|der|crt)$/i.test(f));
  } catch {
    throw new AppleNotConfiguredError(
      `Apple root certificates directory not found: ${env.APPLE_ROOT_CERTS_DIR}. ` +
        `Download the Apple Root CA certs from https://www.apple.com/certificateauthority/ into that directory.`
    );
  }
  if (files.length === 0) {
    throw new AppleNotConfiguredError(
      `No Apple root certificates in ${env.APPLE_ROOT_CERTS_DIR}. ` +
        `Download them from https://www.apple.com/certificateauthority/.`
    );
  }
  return files.map((f) => readFileSync(join(env.APPLE_ROOT_CERTS_DIR, f)));
}

function getVerifier(): SignedDataVerifier {
  if (verifier) return verifier;
  const roots = loadRootCerts();
  const environment =
    env.APPLE_ENVIRONMENT === "Production" ? Environment.PRODUCTION : Environment.SANDBOX;
  verifier = new SignedDataVerifier(
    roots,
    env.APPLE_ENABLE_ONLINE_CHECKS,
    environment,
    env.APPLE_BUNDLE_ID,
    env.APPLE_APP_APPLE_ID
  );
  return verifier;
}

function mapTransaction(tx: JWSTransactionDecodedPayload): AppleResult {
  const expiresAt = tx.expiresDate ? new Date(tx.expiresDate) : null;
  const active = expiresAt === null || expiresAt.getTime() > Date.now();
  return {
    productId: tx.productId ?? null,
    transactionId: (tx.transactionId as string | undefined) ?? null,
    originalTransactionId: tx.originalTransactionId ?? null,
    appAccountToken: (tx.appAccountToken as string | undefined) ?? null,
    expiresAt,
    environment: (tx.environment as string | undefined) ?? env.APPLE_ENVIRONMENT,
    status: active ? "active" : "expired",
  };
}

/** Verify a signed transaction JWS (from StoreKit 2 on the device). */
export async function verifyAppleTransaction(signedTransaction: string): Promise<AppleResult> {
  const tx = await getVerifier().verifyAndDecodeTransaction(signedTransaction);
  return mapTransaction(tx);
}

/* ---------------- App Store Server API (transactionId lookup) ---------------- */

let apiClient: AppStoreServerAPIClient | null = null;

/** True when the App Store Server API credentials are configured. */
export function appStoreApiConfigured(): boolean {
  return !!(env.APPLE_ISSUER_ID && env.APPLE_KEY_ID && env.APPLE_PRIVATE_KEY);
}

function getApiClient(): AppStoreServerAPIClient {
  if (apiClient) return apiClient;
  if (!appStoreApiConfigured()) {
    throw new AppleNotConfiguredError(
      "App Store Server API is not configured — set APPLE_ISSUER_ID, APPLE_KEY_ID and APPLE_PRIVATE_KEY."
    );
  }
  const environment =
    env.APPLE_ENVIRONMENT === "Production" ? Environment.PRODUCTION : Environment.SANDBOX;
  apiClient = new AppStoreServerAPIClient(
    env.APPLE_PRIVATE_KEY!,
    env.APPLE_KEY_ID!,
    env.APPLE_ISSUER_ID!,
    env.APPLE_BUNDLE_ID,
    environment
  );
  return apiClient;
}

/**
 * The robust proof path: the app sends only a transactionId; we ask Apple for
 * its own signed record of that transaction and verify it. This does not trust
 * anything the client signed, and works with StoreKit 1 (cordova-plugin-purchase
 * defaults) where a per-transaction JWS is not exposed to the app.
 */
export async function verifyAppleTransactionId(transactionId: string): Promise<AppleResult> {
  const resp = await getApiClient().getTransactionInfo(transactionId);
  const signed = resp.signedTransactionInfo;
  if (!signed) throw new Error("no signedTransactionInfo returned for transaction");
  const tx = await getVerifier().verifyAndDecodeTransaction(signed);
  return mapTransaction(tx);
}

/** Verify + decode an App Store Server Notification V2 payload. */
export async function verifyAppleNotification(signedPayload: string): Promise<{
  notificationType: string;
  subtype: string | null;
  result: AppleResult | null;
}> {
  const decoded: ResponseBodyV2DecodedPayload =
    await getVerifier().verifyAndDecodeNotification(signedPayload);
  const notificationType = String(decoded.notificationType);
  const subtype = decoded.subtype ? String(decoded.subtype) : null;

  let result: AppleResult | null = null;
  const signedTx = decoded.data?.signedTransactionInfo;
  if (signedTx) {
    const tx = await getVerifier().verifyAndDecodeTransaction(signedTx);
    result = mapTransaction(tx);
    result.status = statusFromNotification(notificationType, subtype, result.expiresAt);
  }
  return { notificationType, subtype, result };
}

/** Map a notification type/subtype to our entitlement status. */
export function statusFromNotification(
  type: string,
  subtype: string | null,
  expiresAt: Date | null
): SubStatus {
  const notExpired = expiresAt === null || expiresAt.getTime() > Date.now();
  switch (type) {
    case "SUBSCRIBED":
    case "DID_RENEW":
    case "OFFER_REDEEMED":
      return "active";
    case "DID_CHANGE_RENEWAL_STATUS":
    case "DID_CHANGE_RENEWAL_PREF":
      return notExpired ? "active" : "expired";
    case "DID_FAIL_TO_RENEW":
      // In the billing grace period the user keeps access until it resolves.
      return subtype === "GRACE_PERIOD" ? "in_grace" : notExpired ? "active" : "expired";
    case "GRACE_PERIOD_EXPIRED":
    case "EXPIRED":
      return "expired";
    case "REFUND":
      return "refunded";
    case "REVOKE":
      return "revoked";
    default:
      return notExpired ? "active" : "expired";
  }
}
