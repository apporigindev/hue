/**
 * entitlement.ts — the single source of truth for "is this user premium?".
 * Pure functions so they are trivially testable.
 */
import type { SubRecord } from "./store.js";

export interface Entitlement {
  active: boolean;
  productId: string | null;
  status: string; // 'active' | 'in_grace' | 'expired' | 'refunded' | 'revoked' | 'none'
  expiresAt: string | null; // ISO
  environment: string | null;
}

export const NO_ENTITLEMENT: Entitlement = {
  active: false,
  productId: null,
  status: "none",
  expiresAt: null,
  environment: null,
};

/** A record grants access while active/in-grace and not past expiry. */
export function toEntitlement(rec: SubRecord | null, now: Date = new Date()): Entitlement {
  if (!rec) return NO_ENTITLEMENT;
  const notExpired = rec.expiresAt === null || rec.expiresAt.getTime() > now.getTime();
  const active = (rec.status === "active" || rec.status === "in_grace") && notExpired;
  return {
    active,
    productId: rec.productId,
    status: active ? rec.status : rec.status === "active" ? "expired" : rec.status,
    expiresAt: rec.expiresAt ? rec.expiresAt.toISOString() : null,
    environment: rec.environment,
  };
}
