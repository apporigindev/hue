#!/usr/bin/env sh
# Download the Apple Root CA certificates required to verify StoreKit signed
# data (@apple/app-store-server-library). These are public certificates; run
# this once during deploy so ./certs is populated. Without them, purchase
# verification is disabled and /v1/tryon returns 503.
set -e
DIR="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)/certs"
mkdir -p "$DIR"
for cert in AppleRootCA-G3 AppleRootCA-G2; do
  echo "Fetching $cert.cer ..."
  curl -fsSL "https://www.apple.com/certificateauthority/$cert.cer" -o "$DIR/$cert.cer"
done
echo "Done. Apple root certs are in: $DIR"
