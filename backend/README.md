# Seasonist — Subscription Backend

A small Fastify (TypeScript, ESM) service that validates in-app purchases and
tracks premium entitlements for the Seasonist app. It powers the paywall's
"is this user premium?" check across devices and handles Apple/Google server
notifications (renewals, expirations, refunds).

**Privacy:** entitlements are keyed by an **anonymous** app-user id the app
generates on-device. No personal data — no name, email, or photo — is ever
sent here or stored. The photo is still analysed entirely on-device.

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/health` | Liveness check |
| `POST` | `/v1/entitlement/verify` | App sends a purchase → validated → entitlement returned |
| `GET` | `/v1/entitlement/:appUserId` | Current entitlement for an anonymous user |
| `POST` | `/v1/apple/notifications` | App Store Server Notifications V2 webhook |
| `POST` | `/v1/google/notifications` | Google Play RTDN (Pub/Sub) webhook |

`verify` body: `{ appUserId, platform: "apple" | "google", signedTransaction?, purchaseToken? }`
→ returns `{ active, productId, status, expiresAt, environment }`.

## Local development

```bash
npm install
cp .env.example .env          # fill in as needed
npm test                      # 9 tests, mocked — no credentials needed
npm run dev                   # tsx watch on :8080
```

Without `DATABASE_URL` it uses an in-memory store (dev only). Without the Apple
root certs it boots fine but purchase routes return 503 until you add them.

## Going live — checklist

The code is complete; these steps need your Apple/Google accounts and a host.

### 1. Database
- Provision Postgres, set `DATABASE_URL`.
- Run the migration: `psql "$DATABASE_URL" -f migrations/001_subscriptions.sql`.

### 2. Apple (App Store)
1. Create the app + **auto-renewable subscription** and/or **non-consumable**
   products in App Store Connect (e.g. `seasonist.premium.annual`,
   `seasonist.premium.monthly`, `seasonist.premium.lifetime`).
2. Download the **Apple Root CA certificates** from
   <https://www.apple.com/certificateauthority/> (at least `AppleRootCA-G3.cer`)
   into `certs/`.
3. Set `APPLE_BUNDLE_ID`, `APPLE_APP_APPLE_ID` (numeric app id),
   `APPLE_ENVIRONMENT` (`Sandbox` for testing, `Production` for release).
4. In App Store Connect → your app → **App Store Server Notifications**, set the
   Production and Sandbox URLs to `https://<your-host>/v1/apple/notifications`
   (Version 2).
5. (Optional) For on-demand status lookups via Apple's API, generate an
   In-App Purchase key and set `APPLE_ISSUER_ID` / `APPLE_KEY_ID` /
   `APPLE_PRIVATE_KEY`. Not required for the verify + notifications flow.

### 3. Google Play (optional — Android)
- Set `GOOGLE_PACKAGE_NAME` and `GOOGLE_SERVICE_ACCOUNT_B64` (base64 of a
  Play Developer API service-account JSON).
- Configure Real-time Developer Notifications (Pub/Sub) to push to
  `https://<your-host>/v1/google/notifications`.

### 4. Deploy
- Host anywhere that runs Node 22 (Railway mirrors the BidPazar setup):
  `npm run build && npm start`. Point `api.seasonist.<your-domain>` at it.
- Secure the app-facing routes by setting `APP_API_KEY` and sending it as the
  `x-api-key` header from the app.

## How the app integrates (StoreKit 2)

1. On first launch, generate a random UUID `appUserId`, store it in the
   Keychain, and pass it as the purchase's `appAccountToken` so Apple's
   notifications carry it back.
2. After a purchase (or on launch), send the StoreKit 2 signed transaction to
   `POST /v1/entitlement/verify`. Gate premium features on `active === true`.
3. On launch, also `GET /v1/entitlement/:appUserId` to refresh state after
   renewals/expirations the server learned about via notifications.

> Note: once the app actually talks to this backend, the Privacy Policy and
> consent copy need a short clause about the anonymous subscription record.
> The "photo never leaves your device" promise is unaffected.
