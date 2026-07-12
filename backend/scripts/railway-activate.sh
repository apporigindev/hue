#!/usr/bin/env bash
# One-shot Railway activation for the Seasonist backend.
# Prereqs: `railway` CLI authed, run from backend/, project linked (railway init
# already done → seasonist-api), Railway plan allows provisioning.
# Usage:  sh scripts/railway-activate.sh
# After it finishes: paste FAL_API_KEY in Railway → seasonist-api → Variables.
set -e

P8="${APPLE_P8_PATH:-C:/Apps/bidpazar/ios/certs/AuthKey_7AFZGYK7M5.p8}"

echo "── 1/5 deploy service (creates it on first run)"
railway up -y --detach

echo "── 2/5 set variables"
APP_KEY=$(openssl rand -hex 24)
railway variables \
  --set "NODE_ENV=production" \
  --set "APPLE_ENVIRONMENT=Sandbox" \
  --set "APPLE_BUNDLE_ID=com.apporigin.seasonist" \
  --set "APPLE_APP_APPLE_ID=6788486948" \
  --set "APPLE_ISSUER_ID=7077636e-09af-41f6-a4a8-aeb18ed6d7e9" \
  --set "APPLE_KEY_ID=7AFZGYK7M5" \
  --set "APPLE_PRIVATE_KEY=$(cat "$P8")" \
  --set "APP_API_KEY=$APP_KEY" \
  --set "TRYON_PROVIDER=fal" \
  --set "TRYON_PRODUCT_ID=seasonist.tryon.unlock" \
  --set "CORS_ORIGINS=https://apporigindev.github.io" \
  --set 'DATABASE_URL=${{Postgres.DATABASE_URL}}'
echo "$APP_KEY" > .app-api-key.local   # gitignored; CI stamp reads it
echo "APP_API_KEY written to backend/.app-api-key.local"

echo "── 3/5 redeploy with variables"
railway up -y --detach

echo "── 4/5 public domain"
railway domain || true

echo "── 5/5 migrations (needs the Postgres service added first)"
PUBLIC_URL=$(railway variables --service Postgres --json 2>/dev/null | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{try{const j=JSON.parse(s);console.log(j.DATABASE_PUBLIC_URL||j.DATABASE_URL||'')}catch(e){console.log('')}})")
if [ -n "$PUBLIC_URL" ]; then
  DATABASE_URL="$PUBLIC_URL" node scripts/migrate.mjs
else
  echo "!! Postgres not found — add it (railway add --database postgres or dashboard), then:"
  echo "   DATABASE_URL=<public url> node scripts/migrate.mjs"
fi

echo "Done. Next: paste FAL_API_KEY in Railway → seasonist-api → Variables."
