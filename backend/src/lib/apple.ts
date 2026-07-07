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
